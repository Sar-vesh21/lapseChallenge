import { Driver } from "neo4j-driver";
import * as schema from "./schema/schema";
import driver from "./driver";

async function initializeDatabase(driver: Driver) {

    try {
      // Initialize schema
      const schemaSession = driver.session();
      try {
        await schemaSession.executeWrite(async tx => {
          await schema.createConstraints(tx);
          await schema.createIndexes(tx);
        });
      } finally {
        await schemaSession.close();
      }

      // Load data in a separate transaction, schema modifications (CREATE CONSTRAINT) with write operations (CREATE nodes) are not allowed in the same transaction.
      const dataSession = driver.session();
      try {
        await dataSession.executeWrite(async tx => {
          await schema.loadObjects(tx);
          await schema.loadEdges(tx);
        });
      } finally {
        await dataSession.close();
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    } finally {
      await driver.close();
    }
}

// TODO: Add this to docker compose
initializeDatabase(driver);