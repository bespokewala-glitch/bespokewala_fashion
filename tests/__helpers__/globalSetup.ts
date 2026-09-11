/**
 * Global Jest setup — starts mongodb-memory-server once for all API tests.
 * Runs in globalSetup (Node process, not test process).
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

export default async function globalSetup() {
  mongod = await MongoMemoryServer.create({
    instance: { dbName: 'bespokewala_test' },
  });
  const uri = mongod.getUri();
  // Expose to child processes via env
  process.env.MONGODB_URI = uri;
  // Store mongod instance for teardown
  (global as any).__MONGOD__ = mongod;
}
