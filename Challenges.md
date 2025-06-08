# General Challenges

This honestly feels like a never ending challenge. I could keep on perfecting this for a while with some of the TODO's I have listed. However I had one biggest challenge by far.

## The biggest challenge

I spent 2 hours alone started at the seed data trying to make sense of it. While I see the components are there, the problem arises in how events actully occur and their order. What actually is a "*feed_post*". Is it a post? Is it a comment? I still don't know. This eventually led me to go in the route of a Graph Database rather than a relational. 

## Other challenged

1. It seems as though the brief was asking for responses the front end was not full expecting. i.e the brief expects:

``` typescript
items: Array<{
    id: string;
    type: string;
    content: object;
    timestamp: string;
  }>;
  ```

but the frontend expects:

```typescript
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
```
, thus some data transformation was required.

2. As a personal challenge, my experience with testing is not the greatest, so it was nice to learn.
3. Graph databases, while I know about them, I had never implemented before, so its fun to learn how cypher works and how its similar to SQL
