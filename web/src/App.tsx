import { useEffect, useState } from 'react'
import apiClient, { NetworkTiming } from './api/client'
import { AxiosRequestConfig } from 'axios'
import './App.css'

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

interface FeedResponse {
  items: FeedItem[]
  next_cursor?: string
}

interface CustomRequestConfig extends AxiosRequestConfig {
  metadata?: {
    onTiming: (timing: NetworkTiming) => void
  }
}

function App() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined)
  const [networkTiming, setNetworkTiming] = useState<NetworkTiming | null>(null)

  const fetchFeed = async (cursor?: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const config: CustomRequestConfig = {
        params: cursor ? { cursor } : undefined,
        metadata: {
          onTiming: (timing: NetworkTiming) => setNetworkTiming(timing)
        }
      }
      
      const response = await apiClient.get<FeedResponse>('/feed', config)
      
      if (cursor) {
        setFeedItems(prev => [...prev, ...response.data.items])
      } else {
        setFeedItems(response.data.items)
      }
      
      setNextCursor(response.data.next_cursor)
    } catch (err) {
      setError('Failed to load feed. Please try again.')
      console.error('Error fetching feed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (itemId: string) => {
    try {
      await apiClient.post(`/feed/items/${itemId}/read`)
      setFeedItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, read: true } : item
        )
      )
    } catch (err) {
      console.error('Error marking item as read:', err)
    }
  }

  useEffect(() => {
    fetchFeed()
  }, [])

  const handleLoadMore = () => {
    if (nextCursor) {
      fetchFeed(nextCursor)
    }
  }

  const handleTryAgain = () => {
    fetchFeed()
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <p className="error-message">{error}</p>
          <button className="try-again-button" onClick={handleTryAgain}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="feed-container">
        {feedItems.map(item => (
          <div
            key={item.id}
            className={`feed-item ${item.read ? 'read' : 'unread'}`}
            onClick={() => markAsRead(item.id)}
          >
            <img
              src={item.actor.avatar_url}
              alt={item.actor.username}
              className="avatar"
            />
            <div className="content">
              <span className="username">{item.actor.username}</span>
              <span className="action">
                {item.type === 'like' && 'liked your post'}
                {item.type === 'comment' && 'commented on your post'}
                {item.type === 'follow' && 'started following you'}
              </span>
              {item.target?.preview_url && (
                <img
                  src={item.target.preview_url}
                  alt="Preview"
                  className="preview"
                />
              )}
            </div>
          </div>
        ))}
        
        {isLoading && <div className="loading">Loading...</div>}
        
        {nextCursor && !isLoading && (
          <button className="load-more-button" onClick={handleLoadMore}>
            Load More
          </button>
        )}
        
        {networkTiming && (
          <div className="network-timing">
            <p>Total time: {networkTiming.total.toFixed(2)}ms</p>
            <p>Request time: {networkTiming.request.toFixed(2)}ms</p>
            <p>Response time: {networkTiming.response.toFixed(2)}ms</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App 