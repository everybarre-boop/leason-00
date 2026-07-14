"use server";

import { db } from "@/db";
import { leads } from "@/db/schema";
import { sendLeadNotification, sendErrorNotification } from "@/lib/email";
import { validateLeadInput, type RawInput } from "./lead-validation";

export type SubmitResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * 레슨 문의 폼 제출을 받아 leads 테이블에 저장한다.
 * 서버에서 다시 한 번 검증하므로 클라이언트 검증을 우회해도 안전하다.
 */
export async function submitLead(input: RawInput): Promise<SubmitResult> {
  const validated = validateLeadInput(input);
  if (!validated.ok) {
    return validated;
  }

  try {
    await db.insert(leads).values(validated.value);
  } catch (err) {
    console.error("submitLead 저장 실패:", err);
    // 예상치 못한 저장 오류는 운영자에게 메일로 알린다(알림 실패는 무시).
    await sendErrorNotification("submitLead 리드 저장 실패", err);
    return { ok: false, error: "저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }

  // 저장 성공 후 운영자에게 알림 메일을 보낸다.
  // 메일 발송 실패는 접수 성공에 영향을 주지 않으므로(내부 로그로만 남긴다),
  // 저장 catch 밖에서 별도로 처리해 예상치 못한 예외가 접수 성공을 뒤집지 않게 한다.
  try {
    await sendLeadNotification(validated.value);
  } catch (err) {
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
