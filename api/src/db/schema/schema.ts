import { ManagedTransaction } from 'neo4j-driver';
import * as fs from 'fs';
import * as path from 'path';

export const createConstraints = async (txc: ManagedTransaction) => {
  const constraints = [
    'CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE',
    'CREATE CONSTRAINT media_id IF NOT EXISTS FOR (m:Media) REQUIRE m.id IS UNIQUE',
    'CREATE CONSTRAINT feed_post_id IF NOT EXISTS FOR (f:FeedPost) REQUIRE f.id IS UNIQUE', // I need some enterprise version to make sure properties are not null
    'CREATE CONSTRAINT comment_id IF NOT EXISTS FOR (c:Comment) REQUIRE c.id IS UNIQUE'
  ];

  for (const constraint of constraints) {
    await txc.run(constraint);
  }
};

export const createIndexes = async (txc: ManagedTransaction) => {
  const indexes = [
    'CREATE INDEX user_timestamp IF NOT EXISTS FOR (u:User) ON (u.timestamp)',
    'CREATE INDEX media_timestamp IF NOT EXISTS FOR (m:Media) ON (m.timestamp)',
    'CREATE INDEX feed_post_timestamp IF NOT EXISTS FOR (f:FeedPost) ON (f.timestamp)',
    'CREATE INDEX comment_timestamp IF NOT EXISTS FOR (c:Comment) ON (c.timestamp)'
  ];

  for (const index of indexes) {
    await txc.run(index);
  }
};

export const loadObjects = async (txc: ManagedTransaction) => {
  const filePath = path.join(__dirname, '../../../data/objects.csv');
  const records = fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .slice(1) // Skip header
    .filter(line => line.trim()) // Remove empty lines
    .map(line => {
      const [id, type, timestamp, metadata] = line.split(',');
      return { id, type, timestamp: parseInt(timestamp), metadata };
    });

  // This takes a while to run, probably need to speed it up at some point
  let i = 0;
  for (const record of records) {
    i++;
    if (i % 1000 === 0) {
      console.log(`Loaded ${i} objects`);
    }
    // Convert feed_post to FeedPost for the label
    const label = record.type === 'feed_post' ? 'FeedPost' : 
                 record.type.charAt(0).toUpperCase() + record.type.slice(1);
    
    if (label === 'FeedPost') {
      await txc.run(`
        MERGE (n:${label} {id: $id})
        ON CREATE SET n.timestamp = $timestamp, n.read = false
        ON MATCH SET n.read = COALESCE(n.read, false)
      `, {
        id: record.id,
        timestamp: record.timestamp
      });

      await txc.run(`
        MATCH (f:FeedPost {id: $id})
        MATCH (m:Media {id: $mediaId})
        CREATE (m)-[:HAS_FEED_POST {
          timestamp: f.timestamp
        }]->(f)
      `, {
        id: record.id,
        mediaId: record.id.split('_')[2]
      });
    } else {
      await txc.run(`
        MERGE (n:${label} {id: $id})
        ON CREATE SET n.timestamp = $timestamp
      `, {
        id: record.id,
        timestamp: record.timestamp
      });
    }
  }
};

export const loadEdges = async (txc: ManagedTransaction) => {
  const filePath = path.join(__dirname, '../../../data/edges.csv');
  const records = fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .slice(1) // Skip header
    .filter(line => line.trim()) // Remove empty lines
    .map(line => {
      const [id1, id2, type, timestamp] = line.split(',');
      return { id1, id2, type, timestamp: parseInt(timestamp) };
    });

  let i = 0;
  for (const record of records) {
    i++;
    if (i % 1000 === 0) {
      console.log(`Loaded ${i} edges`);
    }

    switch (record.type) {
      case 'friends':
        await txc.run(`
          MATCH (u1:User {id: $id1})
          MATCH (u2:User {id: $id2})
          CREATE (u1)-[:FRIENDS {
            timestamp: $timestamp
          }]->(u2)
        `, record);
        break;

      case 'media_shared':
        await txc.run(`
          MATCH (u:User {id: $id1})
          MATCH (m:Media {id: $id2})
          CREATE (u)-[:SHARED {
            timestamp: $timestamp
          }]->(m)
        `, record);
        break;

      case 'media_shared_by':
        await txc.run(`
          MATCH (m:Media {id: $id1})
          MATCH (u:User {id: $id2})
          CREATE (m)-[:SHARED_BY {
            timestamp: $timestamp
          }]->(u)
        `, record);
        break;
    }
  }
};