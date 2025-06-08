import { Request, Response } from 'express';
import feedRouter from '../feed';
import { getFeedPosts, writeBackCache, FeedItem } from '../../redis/apiOperations';
import express from 'express';
import request from 'supertest';

// Mock the redis operations
jest.mock('../../redis/apiOperations', () => ({
  getFeedPosts: jest.fn(),
  writeBackCache: jest.fn(),
}));

describe('Feed Routes', () => {
  let app: express.Application;

  const mockFeedItems: FeedItem[] = [
    {
      id: 'feed_post_1',
      type: 'like',
      actor: {
        id: 'user_1',
        username: 'john_doe',
        avatar_url: 'https://example.com/avatar1.jpg'
      },
      target: {
        id: 'post_1',
        type: 'post',
        preview_url: 'https://example.com/post1.jpg'
      },
      created_at: '2024-03-20T10:00:00Z',
      read: false
    },
    {
      id: 'feed_post_2',
      type: 'comment',
      actor: {
        id: 'user_2',
        username: 'jane_smith',
        avatar_url: 'https://example.com/avatar2.jpg'
      },
      target: {
        id: 'post_2',
        type: 'post',
        preview_url: 'https://example.com/post2.jpg'
      },
      created_at: '2024-03-20T09:30:00Z',
      read: true
    }
  ];

  beforeEach(() => {
    app = express();
    app.use(feedRouter);
  });

  describe('GET /feed', () => {
    it('should return feed items with pagination', async () => {
      (getFeedPosts as jest.Mock).mockResolvedValue(mockFeedItems);

      const response = await request(app)
        .get('/feed')
        .query({ limit: '2' });

      expect(getFeedPosts).toHaveBeenCalledWith(0, 1);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        items: mockFeedItems,
        next_cursor: '2'
      });
    });

    it('should handle empty feed items', async () => {
      (getFeedPosts as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/feed')
        .query({ limit: '10' });

      expect(getFeedPosts).toHaveBeenCalledWith(0, 9);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        items: [],
        next_cursor: undefined
      });
    });

    it('should handle errors gracefully', async () => {
      (getFeedPosts as jest.Mock).mockRejectedValue(new Error('Test error'));

      const response = await request(app)
        .get('/feed');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch feed' });
    });
  });

  describe('POST /feed/items/:itemId/read', () => {
    it('should mark item as read successfully', async () => {
      (writeBackCache as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/feed/items/feed_post_1/read');

      expect(writeBackCache).toHaveBeenCalledWith('feed_post_1');
      expect(response.status).toBe(200);
    });

    it('should handle errors when marking item as read', async () => {
      (writeBackCache as jest.Mock).mockRejectedValue(new Error('Test error'));

      const response = await request(app)
        .post('/feed/items/feed_post_1/read');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to mark item as read' });
    });
  });
}); 