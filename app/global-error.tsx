"use client";

import { useEffect } from "react";
import { reportClientError } from "./actions";

/**
 * 루트 레이아웃까지 포함해 최상위에서 발생한 예외를 잡는 전역 에러 바운더리.
 * 이 컴포넌트가 루트 레이아웃을 대체하므로 직접 <html>/<body>를 렌더링해야 한다.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("전역 렌더링 오류:", error);
    // 루트 레이아웃까지 무너진 최상위 오류를 서버로 보고해 운영자에게 메일 알림을 보낸다.
    void reportClientError("전역 렌더링 오류 (global-error.tsx)", error.message, error.stack);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            padding: "0 24px",
            textAlign: "center",
            fontFamily: "sans-serif",
            color: "#111",
          }}
        >
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
            문제가 발생했습니다
          </h2>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
            일시적인 오류로 페이지를 표시할 수 없습니다. 잠시 후 다시 시도해주세요.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "8px",
              borderRadius: "8px",
              background: "#111827",
              color: "#fff",
              padding: "10px 16px",
              fontSize: "14px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
