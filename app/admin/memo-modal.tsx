"use client";

import { useEffect, useState, type FormEvent } from "react";

import type { Lead, LeadMemo } from "@/db/schema";
import { addMemo, deleteMemo } from "./actions";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function MemoModal({
  lead,
  memos,
  onClose,
  onChanged,
}: {
  lead: Lead;
  memos: LeadMemo[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ESC 키로 닫기
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting || !content.trim()) return;

    setSubmitting(true);
    setError(null);

    const result = await addMemo(lead.id, content);

    setSubmitting(false);

    if (result.ok) {
      setContent("");
      onChanged();
    } else {
      setError(result.error);
    }
  }

  async function handleDelete(memo: LeadMemo) {
    if (deletingId) return;
    if (!window.confirm("이 메모를 삭제하시겠습니까?")) return;

    setDeletingId(memo.id);
    setError(null);

    const result = await deleteMemo(memo.id);

    setDeletingId(null);

    if (result.ok) {
      onChanged();
    } else {
      setError(result.error);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl bg-white p-6 shadow-lg sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">메모</h2>
          <p className="mt-1 text-sm text-gray-500">
            <span className="font-medium text-gray-700">{lead.name}</span> 님의 문의
          </p>
        </header>

        <div className="-mx-1 mb-4 flex flex-1 flex-col gap-3 overflow-y-auto px-1">
          {memos.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              아직 메모가 없습니다.
            </p>
          ) : (
            memos.map((memo) => (
              <div
                key={memo.id}
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5"
              >
                <p className="whitespace-pre-wrap break-words text-sm text-gray-800">
                  {memo.content}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {dateFormatter.format(memo.createdAt)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(memo)}
                    disabled={deletingId === memo.id}
                    className="text-xs font-medium text-red-500 transition-colors hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === memo.id ? "삭제 중…" : "삭제"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAdd} className="flex flex-col gap-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="메모를 입력하세요"
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              닫기
            </button>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "추가 중…" : "메모 추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
