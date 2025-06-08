import { Driver } from "neo4j-driver";
import * as schema from "./schema/schema";
import driver from "./driver";
import logger from "../utils/logger";

const initializeDatabase = async (driver: Driver) => {

    try {
      // Initialize schema
      const schemaSession = driver.session();
      try {
        await schemaSession.executeWrite(async tx => {
          logger.info('Creating constraints');
          await schema.createConstraints(tx);
          logger.info('Creating indexes');
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
          logger.info('Loaded objects');
          await schema.loadEdges(tx);
          logger.info('Loaded edges');
        });
      } finally {
        await dataSession.close();
      }
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    } finally {
      await driver.close();
    }
}

initializeDatabase(driver)
  .then(() => {
    logger.info('Database initialization completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Database initialization failed:', error);
    process.exit(1);
  });