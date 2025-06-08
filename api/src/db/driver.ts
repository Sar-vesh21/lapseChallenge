import { Driver } from "neo4j-driver";
import * as neo4j from "neo4j-driver";

const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'your_password';

export const driver: Driver = neo4j.driver(
  'bolt://localhost:7687', // TODO: FIX THIS
  neo4j.auth.basic('neo4j', NEO4J_PASSWORD) // TODO: FIX THIS
);

export default driver;