"use client";

import { useRef, useState, type FormEvent } from "react";
import posthog from "posthog-js";
import { fireConfetti } from "./confetti";
import { logStage, newTraceId } from "@/lib/logger";
import { submitLead } from "./actions";

type FormState = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  phone: "",
  message: "",
};

export function LeadForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 폼 작성 시작 이벤트를 세션당 한 번만 보내기 위한 플래그.
  const startedRef = useRef(false);

  function update<K extends keyof FormState>(key: K, value: string) {
    if (!startedRef.current) {
      startedRef.current = true;
      // 사용자가 처음으로 입력을 시작 — 퍼널 최상단.
      posthog.capture("lead_form_started");
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    // 브라우저 콘솔 쪽 traceId. 서버 로그의 traceId와는 별개이므로
    // 두 로그를 이을 때는 시간순으로 대조한다.
    const traceId = newTraceId();
    const startedAt = Date.now();
    logStage(traceId, "client:submit");

    try {
      const result = await submitLead(form);
      logStage(traceId, "client:result", { ok: result.ok, ms: Date.now() - startedAt });

      if (result.ok) {
        // 리드 접수 성공 — 핵심 전환 이벤트. 개인정보(이름/이메일 등)는 담지 않는다.
        posthog.capture("lead_submitted");
        setSubmitted(true);
        fireConfetti();
      } else {
        // 서버가 준 code로 구분한다. 저장 실패(db_error)를 입력 오류로 집계하면
        // 장애가 "사용자 입력 실수"로 보여 감지가 늦어진다.
        posthog.capture("lead_submit_failed", { reason: result.code });
        setError(result.error);
      }
    } catch (err) {
      // 서버 액션 호출 자체가 실패한 경우(네트워크 끊김, 서버 오류 등).
      logStage(traceId, "client:result", {
        ok: false,
        ms: Date.now() - startedAt,
        error: err instanceof Error ? err.message : String(err),
      });
      console.error("문의 제출 실패:", err);
      posthog.capture("lead_submit_failed", { reason: "server_error" });
      setError("일시적인 오류로 전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    // 접수 완료 후 "새 문의 작성하기"를 눌러 재작성 시작.
    posthog.capture("lead_form_reset");
    startedRef.current = false;
    setForm(initialState);
    setSubmitted(false);
    setError(null);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">문의가 접수되었습니다!</h2>
          <p className="mt-1 text-sm text-gray-500">
            빠른 시일 내에 남겨주신 연락처로 답변드리겠습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="mt-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          새 문의 작성하기
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <Field label="이름" htmlFor="name" required>
        <input
          id="name"
          type="text"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="홍길동"
          className={inputClass}
        />
      </Field>

      <Field label="이메일" htmlFor="email" required>
        <input
          id="email"
          type="email"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="example@email.com"
          className={inputClass}
        />
      </Field>

      <Field label="전화번호" htmlFor="phone" required>
        <input
          id="phone"
          type="tel"
          required
          inputMode="tel"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="010-1234-5678"
          className={inputClass}
        />
      </Field>

      <Field label="문의 내용" htmlFor="message" required>
        <textarea
          id="message"
          required
          rows={4}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="문의하실 내용을 자유롭게 작성해주세요."
          className={`${inputClass} resize-none`}
        />
      </Field>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "보내는 중…" : "문의 보내기"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
