import { asc, desc } from "drizzle-orm";

import { db } from "@/db";
import { leads, leadMemos, type LeadMemo } from "@/db/schema";
import { LeadsTable } from "./leads-table";

// 항상 최신 리드 목록을 보여준다.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [rows, memos] = await Promise.all([
    db.select().from(leads).orderBy(desc(leads.createdAt)),
    db.select().from(leadMemos).orderBy(asc(leadMemos.createdAt)),
  ]);

  // 리드별로 메모를 묶어 오래된 순으로 전달한다.
  const memosByLead: Record<string, LeadMemo[]> = {};
  for (const memo of memos) {
    (memosByLead[memo.leadId] ??= []).push(memo);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto w-full max-w-5xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">레슨 문의 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            총 <span className="font-semibold text-gray-900">{rows.length}</span>건의 문의가 접수되었습니다.
          </p>
        </header>
        <LeadsTable leads={rows} memosByLead={memosByLead} />
      </div>
    </main>
  );
}
