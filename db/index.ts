import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Supabase는 connection pooler를 사용하므로 prepare를 비활성화한다.
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
