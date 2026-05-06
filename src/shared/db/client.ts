import { Db, MongoClient } from 'mongodb';

declare global {
  // eslint-disable-next-line no-var
  var __mongo__: { client: MongoClient; db: Db } | undefined;
}

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} environment variable`);
  return v;
}

export async function getDb(): Promise<Db> {
  if (globalThis.__mongo__?.db) return globalThis.__mongo__.db;

  const uri = requiredEnv('MONGODB_URI');
  const dbName = process.env.MONGODB_DB_NAME ?? 'samjhoai';

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  globalThis.__mongo__ = { client, db };
  return db;
}

