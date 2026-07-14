"use client";

import { useEffect } from "react";
import { reportClientError } from "./actions";

/**
 * 라우트 세그먼트 렌더링 중 발생한 예상치 못한 예외를 잡는 에러 바운더리.
 * 루트 레이아웃은 유지되며, reset()으로 해당 세그먼트를 다시 렌더링해 복구를 시도한다.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("페이지 렌더링 오류:", error);
    // 예상치 못한 렌더링 오류를 서버로 보고해 운영자에게 메일 알림을 보낸다.
    void reportClientError("페이지 렌더링 오류 (error.tsx)", error.message, error.stack);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <svg
          className="h-8 w-8 text-red-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">문제가 발생했습니다</h2>
        <p className="mt-1 text-sm text-gray-500">
          잠시 후 다시 시도해주세요. 문제가 계속되면 관리자에게 문의해주세요.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
      >
        다시 시도
      </button>
    </div>
  );
}
