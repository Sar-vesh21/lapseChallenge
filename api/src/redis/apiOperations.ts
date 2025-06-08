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

const writeBackCache = async (feedPost_id: string) => {
    const session = driver.session();
    let redisConnected = false;

    try {
        // Connect to Redis if not already connected
        if (!redisClient.isOpen) {
            await redisClient.connect();
            redisConnected = true;
        }

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
    } finally {
        // Only disconnect Redis if we connected it in this function
        if (redisConnected) {
            await redisClient.quit();
        }
    }
}

const getFeedPosts = async (start: number, end: number) => {
    let redisConnected = false;

    try {
        // Connect to Redis if not already connected
        if (!redisClient.isOpen) {
            await redisClient.connect();
            redisConnected = true;
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
                created_at: new Date(item.score).toISOString(),
                read: value.read
            });
        }

        return feedItems;
    } catch (error) {
        console.error('Error fetching feed posts:', error);
        throw error;
    } finally {
        if (redisConnected) {
            await redisClient.quit();
        }
    }
}

export { writeBackCache, getFeedPosts };
