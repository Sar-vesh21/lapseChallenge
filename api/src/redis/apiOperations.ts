import driver from '../db/driver';
import redisClient from './client';

export interface FeedItem {
    id: string;
    type: 'like' | 'comment' | 'follow';
    actor: {
        id: string;
        username: string;
        avatar_url: string;
    };
    target?: {
        id: string;
        type: 'post' | 'comment';
        preview_url?: string;
    };
    created_at: string;
    read: boolean;
}

// Helper function to ensure Redis connection
const ensureRedisConnection = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
};

export const warmReadFeedCache = async () => {
    console.log('Warming MORE read feed cache');
    const session = driver.session();

    try {
        await ensureRedisConnection();

        // Get the latest timestamp from Redis
        const latestItems = await redisClient.zRangeWithScores('feed_posts', 0, 0);
        const latestTimestamp = latestItems[0]?.score || Date.now();

        const feedPosts = await session.run(`
            MATCH (f:FeedPost)
            WHERE f.id STARTS WITH 'feed_post_' AND f.read = true
            WITH f
            ORDER BY f.timestamp DESC
            RETURN f.id as id, f.timestamp as timestamp, f.read as read
            LIMIT 100
        `, { latestTimestamp });

        // Add new posts to Redis
        const pipeline = redisClient.multi();
        for (const record of feedPosts.records) {
            const { id, timestamp, read } = record.toObject();
            pipeline.zAdd('feed_posts', {
                score: 0,
                value: JSON.stringify({ id, read, timestamp })
            });
            pipeline.expire('feed_posts', 60); // Add a TTL for these ones 
        }

        await pipeline.exec();
        console.log(`Successfully warmed cache with ${feedPosts.records.length} new feed posts`);
    } catch (error) {
        console.error('Error warming more feed posts:', error);
        throw error;
    } finally {
        await session.close();
    }
};

const writeBackCache = async (feedPost_id: string) => {
    const session = driver.session();

    try {
        await ensureRedisConnection();

        // Remove the item from Redis by its value
        const value = JSON.stringify({ id: feedPost_id });
        await redisClient.zRem('feed_posts', value);

        // ASYNC Update the feed post as read in the database
        session.run(`
            MATCH (f:FeedPost {id: $feedPost_id})
            SET f.read = true
            RETURN f
        `, { feedPost_id })
        .then(result => {
            if (result.records.length === 0) {
                console.error(`Feed post ${feedPost_id} not found in database`);
            } else {
                console.log(`Successfully marked feed post ${feedPost_id} as read in database`);
            }
        })
        .catch(error => {
            console.error('Error updating database:', error);
        })
        .finally(() => {
            session.close();
        });

        console.log(`Successfully removed feed post ${feedPost_id} from cache`);
    } catch (error) {
        console.error('Error in writeBackCache:', error);
        throw error;
    }
}

const getFeedPosts = async (start: number, end: number) => {
    try {
        await ensureRedisConnection();

        // Get total count of items
        const totalItems = await redisClient.zCard('feed_posts');
        
        // If we're within 20% of the end, trigger async cache warming
        if (end > totalItems * 0.8) {
            console.log('Warming more read feed cache');
            warmReadFeedCache().catch(error => {
                console.error('Error in background cache warming:', error);
            });
        }

        const items = await redisClient.zRangeWithScores('feed_posts', start, end);

        // Transform Redis response into required format
        const feedItems: FeedItem[] = [];
        for (const item of items) {
            const value = JSON.parse(item.value);
            feedItems.push({
                id: value.id,
                type: value.type,
                actor: {
                    id: value.actor?.id || '1',
                    username: value.actor?.username || 'John Doe',
                    avatar_url: value.actor?.avatar_url || 'https://via.placeholder.com/150'
                },
                target: {
                    id: value.target?.id || '1',
                    type: value.target?.type || 'post',
                    preview_url: value.target?.preview_url || 'https://via.placeholder.com/150'
                },
                created_at: new Date(value.timestamp).toISOString(),
                read: value.read
            });
        }

        return feedItems;
    } catch (error) {
        console.error('Error fetching feed posts:', error);
        throw error;
    }
}

export { writeBackCache, getFeedPosts };
