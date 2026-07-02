"use server";

import { db } from "@/db";
import { leads } from "@/db/schema";
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
    return { ok: true };
  } catch (err) {
    console.error("submitLead 저장 실패:", err);
    return { ok: false, error: "저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }
}
