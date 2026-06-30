import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

/**
 * leads — 레슨 문의 리드
 * 이름, 이메일, 전화번호, 문의 내용을 수집한다.
 */
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
