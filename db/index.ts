import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// dev에서는 파일을 저장할 때마다 이 모듈이 다시 평가된다. 캐싱하지 않으면
// 저장할 때마다 새 커넥션 풀이 생기고 이전 풀은 커넥션을 쥔 채 방치되어,
// 몇 번 만에 Supabase 풀러의 클라이언트 슬롯이 소진된다.
const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof postgres> | undefined;
};

// prepare: false 는 Supabase 트랜잭션 모드 pooler(6543)가 prepared statement를
// 지원하지 않기 때문에 필수다. 제거하지 말 것.
const client =
  globalForDb.client ?? postgres(connectionString, { prepare: false, max: 5 });

if (process.env.NODE_ENV !== "production") {
  globalForDb.client = client;
}

export const db = drizzle(client, { schema });
