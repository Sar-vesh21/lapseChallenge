import { Router, Request, Response } from 'express';
import { writeBackCache, getFeedPosts, FeedItem } from '../redis/apiOperations';


const router = Router();

// Get feed items with pagination
router.get('/feed', async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const cursor = req.query.cursor as string;

  try {
    const start = cursor ? parseInt(cursor) : 0;
    const end = start + limit - 1;

    // Get feed items from Redis cache
    const feedItems: FeedItem[] = await getFeedPosts(start, end);

    // Calculate next cursor
    const nextCursor = feedItems.length === limit ? (end + 1).toString() : undefined;

    res.json({
      items: feedItems,
      next_cursor: nextCursor
    });

  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

// Mark item as read
router.post('/feed/items/:itemId/read', async (req: Request, res: Response) => {
  const { itemId } = req.params;

  try {
    // Update database and cache asynchronously using writeBackCache
    await writeBackCache(itemId).catch(error => {
      console.error('Error in writeBackCache:', error);
    });

    res.status(200).send();
  } catch (error) {
    console.error('Error marking item as read:', error);
    res.status(500).json({ error: 'Failed to mark item as read' });
  }
});

export default router; 