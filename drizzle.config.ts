import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Next.js와 동일하게 .env.local 을 우선 로드한다.
config({ path: ".env.local" });

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
