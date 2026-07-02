"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { Lead } from "@/db/schema";
import { deleteLead } from "./actions";
import { EditModal } from "./edit-modal";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q)
    );
  }, [leads, query]);

  async function handleDelete(lead: Lead) {
    if (deletingId) return;
    if (!window.confirm(`'${lead.name}' 님의 문의를 정말 삭제하시겠습니까?`)) {
      return;
    }

    setDeletingId(lead.id);
    setError(null);

    const result = await deleteLead(lead.id);

    setDeletingId(null);

    if (result.ok) {
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="이름 또는 이메일로 검색"
        className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {leads.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500">
          접수된 문의가 없습니다.
        </p>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500">
          검색 결과가 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2.5">이름</th>
                <th className="px-3 py-2.5">이메일</th>
                <th className="px-3 py-2.5">전화번호</th>
                <th className="px-3 py-2.5">문의 내용</th>
                <th className="px-3 py-2.5 whitespace-nowrap">접수일시</th>
                <th className="px-3 py-2.5 text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} className="border-b border-gray-100 align-top">
                  <td className="px-3 py-3 font-medium text-gray-900">{lead.name}</td>
                  <td className="px-3 py-3 text-gray-700">{lead.email}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-gray-700">{lead.phone}</td>
                  <td className="max-w-xs px-3 py-3 text-gray-700">
                    <span className="line-clamp-2" title={lead.message}>
                      {lead.message}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-gray-500">
                    {dateFormatter.format(lead.createdAt)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setEditingLead(lead)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(lead)}
                        disabled={deletingId === lead.id}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === lead.id ? "삭제 중…" : "삭제"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingLead && (
        <EditModal
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onSaved={() => {
            setEditingLead(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
