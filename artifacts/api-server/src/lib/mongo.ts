import { MongoClient } from "mongodb";

let client: MongoClient | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/academicworld";
    client = new MongoClient(uri);
    await client.connect();
  }
  return client;
}

export async function getMongoDb() {
  const c = await getMongoClient();
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/academicworld";
  const dbName = uri.split("/").pop()?.split("?")[0] || "academicworld";
  return c.db(dbName);
}
