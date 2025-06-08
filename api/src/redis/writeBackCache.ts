import { Driver } from 'neo4j-driver';
import driver from '../db/driver';
import redisClient from './client';
import { createClient } from 'redis';

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

export default writeBackCache;
