// This file is used to warm the feed cache on startup.
import { Driver } from 'neo4j-driver';
import driver from '../db/driver';
import redisClient from './client';
import { createClient } from 'redis';
import logger from '../utils/logger';

interface FeedPost {
  id: string;
  timestamp: number;
  read: boolean;
}

export const warmFeedCache = async (driver: Driver, redisClient: ReturnType<typeof createClient>) => {

  try {
    await redisClient.connect();

    // Get all FeedPost nodes from Neo4j
    const session = driver.session();
    try {
      const feedPosts = await session.run<FeedPost>(`
        MATCH (f:FeedPost)
        WHERE f.id STARTS WITH 'feed_post_' AND f.read = false
        WITH f
        ORDER BY f.timestamp DESC
        RETURN f.id as id, f.timestamp as timestamp, f.read as read
      `);

      // Clear existing feed posts from Redis on startup
      await redisClient.del('feed_posts');

      // Create transaction to add posts to Redis sorted set with timestamp as score. We might need to consider storage on large datasets.
      const pipeline = redisClient.multi();
      
      for (const record of feedPosts.records) {
        const { id, timestamp, read } = record.toObject() as FeedPost;
        pipeline.zAdd('feed_posts', {
          score: -timestamp,
          value: JSON.stringify({ id, read, timestamp }) // Value is a string
        });
      }

      await pipeline.exec();
      logger.info(`Successfully cached ${feedPosts.records.length} feed posts in Redis`);
    } finally {
      await session.close();
    }
  } catch (error) {
    logger.error('Error warming feed cache:', error);
    throw error;
  } finally {
    await redisClient.quit();
  }
}

warmFeedCache(driver, redisClient)
  .then(() => {
    logger.info('Cache warming completed successfully');
    process.exit(0);  
  })
  .catch((error) => {
    logger.error('Cache warming failed:', error);
    process.exit(1);
  });