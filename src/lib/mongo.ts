import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME ?? 'samjhoai';

if (!uri) {
  throw new Error('Missing MONGODB_URI environment variable');
}

declare global {
  var __mongo__: { client: MongoClient; db: Db } | undefined;
}

const cached = globalThis.__mongo__;

const client = cached?.client ?? new MongoClient(uri);
const db = cached?.db ?? client.db(dbName);

if (!cached) {
  globalThis.__mongo__ = { client, db };
}

export const mongoClient = client;
export const mongoDb = db;
