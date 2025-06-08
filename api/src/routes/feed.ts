import { Router } from 'express';
import redisClient from '../redis/client';

interface FeedItem {
    id: string
    type: 'like' | 'comment' | 'follow'
    actor: {
      id: string
      username: string
      avatar_url: string
    }
    target?: {
      id: string
      type: 'post' | 'comment'
      preview_url?: string
    }
    created_at: string
    read: boolean
}

const router = Router();

// Get feed items with pagination
router.get('/feed', async (req, res) => {
//   console.log('Feed request received');
  const limit = parseInt(req.query.limit as string) || 20;
  const cursor = req.query.cursor as string;

  try {
    await redisClient.connect();

    // Get items from Redis sorted set
    const start = cursor ? parseInt(cursor) : 0;
    const end = start + limit - 1;

    const items = await redisClient.zRangeWithScores('feed_posts', start, end)
    console.log(items);

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

    // Calculate next cursor
    const nextCursor = items.length === limit ? (end + 1).toString() : undefined;

    res.json({
      items: feedItems,
      next_cursor: nextCursor
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  } finally {
    await redisClient.quit();
  }
});

// Mark item as read
router.post('/feed/items/:itemId/read', async (req, res) => {
  return res.status(200).send();
});

export default router; 