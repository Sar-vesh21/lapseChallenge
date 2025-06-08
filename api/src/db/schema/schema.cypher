// Create constraints for unique IDs
CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE;
CREATE CONSTRAINT media_id IF NOT EXISTS FOR (m:Media) REQUIRE m.id IS UNIQUE;
CREATE CONSTRAINT feed_post_id IF NOT EXISTS FOR (f:FeedPost) REQUIRE f.id IS UNIQUE;
CREATE CONSTRAINT feed_post_read IF NOT EXISTS FOR (f:FeedPost) REQUIRE f.id IS NOT NULL;
CREATE CONSTRAINT comment_id IF NOT EXISTS FOR (c:Comment) REQUIRE c.id IS UNIQUE;

// Create indexes for timestamps
CREATE INDEX user_timestamp IF NOT EXISTS FOR (u:User) ON (u.timestamp);
CREATE INDEX media_timestamp IF NOT EXISTS FOR (m:Media) ON (m.timestamp);
CREATE INDEX feed_post_timestamp IF NOT EXISTS FOR (f:FeedPost) ON (f.timestamp);
CREATE INDEX comment_timestamp IF NOT EXISTS FOR (c:Comment) ON (c.timestamp);

// Create User-Comment Relationships
MATCH (c:Comment)-[:ON]->(m)
MATCH (m:Media)-[:HAS_FEED_POST]->(f)
MATCH (u:User)-[:SHARED]->(m)
CREATE (u)-[:WROTE {
    timestamp: c.timestamp
}]->(c); 