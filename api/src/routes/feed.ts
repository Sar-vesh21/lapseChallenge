import { Router, Request, Response } from 'express';
import { writeBackCache, getFeedPosts, FeedItem } from '../redis/apiOperations';
import logger from '../utils/logger';

const router = Router();

// Get feed items with pagination
router.get('/feed', async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const cursor = req.query.cursor as string;

  logger.debug('Fetching feed items', { limit, cursor });

  try {
    const start = cursor ? parseInt(cursor) : 0;
    const end = start + limit - 1;

    // Get feed items from Redis cache
    const feedItems: FeedItem[] = await getFeedPosts(start, end);

    // Calculate next cursor
    const nextCursor = feedItems.length === limit ? (end + 1).toString() : undefined;

    logger.debug('Successfully fetched feed items', { 
      count: feedItems.length,
      nextCursor 
    });

    res.json({
      items: feedItems,
      next_cursor: nextCursor
    });

  } catch (error) {
    logger.error('Error fetching feed:', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

// Mark item as read
router.post('/feed/items/:itemId/read', async (req: Request, res: Response) => {
  const { itemId } = req.params;

  logger.debug('Marking item as read', { itemId });

  try {
    // Update database and cache using writeBackCache
    await writeBackCache(itemId);
    logger.info('Successfully marked item as read', { itemId });
    res.status(200).send();
  } catch (error) {
    logger.error('Error marking item as read:', {
      itemId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: 'Failed to mark item as read' });
  }
});

export default router; 