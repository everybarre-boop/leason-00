"use server";

import { db } from "@/db";
import { leads } from "@/db/schema";
import { sendLeadNotification, sendErrorNotification } from "@/lib/email";
import { logStage, newTraceId } from "@/lib/logger";
import { validateLeadInput, type RawInput } from "./lead-validation";

export type SubmitResult =
  | { ok: true }
  // code는 실패 원인을 계약으로 구분한다. 사용자 노출 문자열로 분기하면
  // 문구만 바뀌어도 집계가 조용히 어긋나므로 분석/분기는 code를 쓴다.
  | { ok: false; code: "validation" | "db_error"; error: string };

/**
 * 레슨 문의 폼 제출을 받아 leads 테이블에 저장한다.
 * 서버에서 다시 한 번 검증하므로 클라이언트 검증을 우회해도 안전하다.
 */
export async function submitLead(input: RawInput): Promise<SubmitResult> {
  const traceId = newTraceId();
  logStage(traceId, "action:received", {
    // 값 자체가 아니라 길이만 남겨 개인정보 노출 없이 입력 도달 여부를 확인한다.
    // 서버 액션은 조작된 요청도 받으므로 input 자체가 객체가 아닐 수 있다.
    nameLen: input?.name?.length ?? 0,
    emailLen: input?.email?.length ?? 0,
    phoneLen: input?.phone?.length ?? 0,
    messageLen: input?.message?.length ?? 0,
  });

  const validated = validateLeadInput(input);
  if (!validated.ok) {
    logStage(traceId, "action:validated", { ok: false, error: validated.error });
    return { ok: false, code: "validation", error: validated.error };
  }
  logStage(traceId, "action:validated", { ok: true });

  const startedAt = Date.now();
  try {
    await db.insert(leads).values(validated.value);
    logStage(traceId, "db:insert", { ok: true, ms: Date.now() - startedAt });
  } catch (err) {
    logStage(traceId, "db:insert", {
      ok: false,
      ms: Date.now() - startedAt,
      error: err instanceof Error ? err.message : String(err),
    });
    console.error("submitLead 저장 실패:", err);
    // 예상치 못한 저장 오류는 운영자에게 메일로 알린다(알림 실패는 무시).
    await sendErrorNotification("submitLead 리드 저장 실패", err);
    return {
      ok: false,
      code: "db_error",
      error: "저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    };
  }

  // 저장 성공 후 운영자에게 알림 메일을 보낸다.
  // 메일 발송 실패는 접수 성공에 영향을 주지 않으므로(내부 로그로만 남긴다),
  // 저장 catch 밖에서 별도로 처리해 예상치 못한 예외가 접수 성공을 뒤집지 않게 한다.
  try {
    // sendLeadNotification은 예외를 던지지 않고 성공 여부를 반환하므로
    // catch가 아니라 반환값을 봐야 발송 실패를 알 수 있다.
    const sent = await sendLeadNotification(validated.value);
    logStage(traceId, "email:notify", { ok: sent });
  } catch (err) {
    logStage(traceId, "email:notify", {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
    console.error("리드 알림 메일 발송 중 예외:", err);
  }

  return { ok: true };
}

/**
 * 클라이언트 에러 바운더리(error.tsx / global-error.tsx)에서 잡은
 * 예상치 못한 에러를 서버로 전달해 운영자에게 메일로 알린다.
 * 화면 복구 흐름을 막지 않도록 어떤 경우에도 예외를 던지지 않는다.
 */
export async function reportClientError(
  context: string,
  message: string,
  stack?: string
): Promise<void> {
  try {
    const error = new Error(message);
    if (stack) {
      error.stack = stack;
    }
    await sendErrorNotification(context, error);
  } catch (err) {
    console.error("클라이언트 에러 보고 실패:", err);
  }
}
