import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod;

// Starts an in-memory MongoDB instance and connects Mongoose to it.
// Called once per test file (from a beforeAll), so tests never touch
// a real database -- local, CI, or production.
export async function connectTestDB() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
}

// Wipes all collections between tests so each test starts from a clean
// slate without needing to manually delete documents it created.
export async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

// Disconnects Mongoose and stops the in-memory server. Called once
// per test file (from an afterAll) so Jest can exit cleanly.
export async function closeTestDB() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}
