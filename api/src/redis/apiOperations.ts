import driver from '../db/driver';
import redisClient from './client';
import logger from '../utils/logger';

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
        logger.debug('Redis connection not open, attempting to connect');
        await redisClient.connect();
        logger.debug('Redis connection established');
    }
};

export const warmReadFeedCache = async () => {
    logger.info('Starting feed cache warm-up');
    const session = driver.session();

    try {
        await ensureRedisConnection();

        // Get the latest timestamp from Redis
        const latestItems = await redisClient.zRangeWithScores('feed_posts', 0, 0);
        const latestTimestamp = latestItems[0]?.score || Date.now();
        logger.debug('Retrieved latest timestamp from Redis', { latestTimestamp });

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
        logger.info('Cache warm-up completed', { 
            postsAdded: feedPosts.records.length,
            cacheKey: 'feed_posts'
        });
    } catch (error) {
        logger.error('Error during cache warm-up:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    } finally {
        await session.close();
    }
};

const writeBackCache = async (feedPost_id: string) => {
    logger.debug('Starting write-back cache operation', { feedPost_id });
    const session = driver.session();

    try {
        await ensureRedisConnection();

        // Remove the item from Redis by its value
        const value = JSON.stringify({ id: feedPost_id });
        await redisClient.zRem('feed_posts', value);
        logger.debug('Removed item from Redis cache', { feedPost_id });

        // ASYNC Update the feed post as read in the database
        session.run(`
            MATCH (f:FeedPost {id: $feedPost_id})
            SET f.read = true
            RETURN f
        `, { feedPost_id })
        .then(result => {
            if (result.records.length === 0) {
                logger.warn('Feed post not found in database', { feedPost_id });
            } else {
                logger.info('Successfully marked feed post as read in database', { feedPost_id });
            }
        })
        .catch(error => {
            logger.error('Error updating database:', {
                feedPost_id,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
        })
        .finally(() => {
            session.close();
        });

        logger.info('Write-back cache operation completed', { feedPost_id });
    } catch (error) {
        logger.error('Error in write-back cache operation:', {
            feedPost_id,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}

const getFeedPosts = async (start: number, end: number) => {
    logger.debug('Fetching feed posts', { start, end });
    try {
        await ensureRedisConnection();

        // Get total count of items
        const totalItems = await redisClient.zCard('feed_posts');
        logger.debug('Retrieved total items count', { totalItems });
        
        // If we're within 20% of the end, trigger async cache warming
        if (end > totalItems * 0.8) {
            logger.info('Triggering background cache warm-up', { 
                currentEnd: end,
                totalItems,
                threshold: totalItems * 0.8
            });
            warmReadFeedCache().catch(error => {
                logger.error('Background cache warm-up failed:', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined
                });
            });
        }

        const items = await redisClient.zRangeWithScores('feed_posts', start, end);
        logger.debug('Retrieved items from Redis', { 
            itemsCount: items.length,
            range: `${start}-${end}`
        });

        // Transform Redis response into required format
        const feedItems: FeedItem[] = [];
        for (const item of items) {
            const value = JSON.parse(item.value);
            feedItems.push({
                id: value.id,
                type: value.type,
                actor: {
                    id: value.actor?.id || '1',
                    username: value.actor?.username || `User${Math.floor(Math.random() * 1000)}`,
                    avatar_url: value.actor?.avatar_url || `https://randomuser.me/api/portraits/lego/${Math.floor(Math.random() * 8)}.jpg`
                },
                target: {
                    id: value.target?.id || '1',
                    type: value.target?.type || 'post',
                    preview_url: value.target?.preview_url || `https://randomuser.me/api/portraits/lego/${Math.floor(Math.random() * 8)}.jpg`
                },
                created_at: new Date(value.timestamp).toISOString(),
                read: value.read
            });
        }

        logger.info('Successfully retrieved and transformed feed posts', { 
            count: feedItems.length,
            range: `${start}-${end}`
        });
        return feedItems;
    } catch (error) {
        logger.error('Error fetching feed posts:', {
            start,
            end,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}

export { writeBackCache, getFeedPosts };
