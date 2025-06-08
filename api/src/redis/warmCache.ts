// This file is used to warm the feed cache on startup.
import { Driver } from 'neo4j-driver';
import { createClient } from 'redis';
import driver from '../db/driver';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

interface FeedPost {
  id: string;
  timestamp: number;
  read: boolean;
}

export async function warmFeedCache(driver: Driver) {
  const redisClient = createClient({
    url: REDIS_URL
  });

  try {
    await redisClient.connect();

    // Get all FeedPost nodes from Neo4j
    const session = driver.session();
    try {
      const feedPosts = await session.run<FeedPost>(`
        MATCH (f:FeedPost)
        WHERE f.id STARTS WITH 'feed_post_'
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
          score: timestamp,
          value: JSON.stringify({ id, read }) // Value is a string
        });
      }

      await pipeline.exec();
      console.log(`Successfully cached ${feedPosts.records.length} feed posts in Redis`);
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error warming feed cache:', error);
    throw error;
  } finally {
    await redisClient.quit();
  }
}

// TODO: Add this to docker compose
warmFeedCache(driver);