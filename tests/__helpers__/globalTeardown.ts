/**
 * Global Jest teardown — stops the mongodb-memory-server after all tests.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function globalTeardown() {
  const mongod: MongoMemoryServer = (global as any).__MONGOD__;
  if (mongod) {
    await mongod.stop();
  }
}
