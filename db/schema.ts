import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";

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

/**
 * lead_memos — 리드별 어드민 메모
 * 한 리드에 메모를 여러 개 남길 수 있다 (leads 1 : N lead_memos).
 * 리드를 삭제하면 딸린 메모도 함께 삭제된다(cascade).
 */
export const leadMemos = pgTable(
  "lead_memos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("lead_memos_lead_id_idx").on(t.leadId)]
);

export type LeadMemo = typeof leadMemos.$inferSelect;
export type NewLeadMemo = typeof leadMemos.$inferInsert;
