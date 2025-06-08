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

// Create User-Media Relationships (user creates media)
MATCH (u:User), (m:Media)
WHERE u.id = m.created_by
CREATE (u)-[:CREATED]->(m);

// Create User-Comment Relationships (user creates comment)
MATCH (u:User), (c:Comment)
WHERE u.id = c.created_by
CREATE (u)-[:CREATED]->(c);

// Create Comment-FeedPost Relationships (comment on feed post)
MATCH (c:Comment), (f:FeedPost)
WHERE c.feed_post_id = f.id
CREATE (c)-[:ON]->(f);
