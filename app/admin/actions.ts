"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { leads, leadMemos } from "@/db/schema";
import { validateLeadInput, type RawInput } from "@/app/lead-validation";

// 메모 한 건의 최대 길이(문자 수).
const MEMO_MAX_LENGTH = 2000;

export type AdminActionResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * 기존 리드를 수정한다. 폼 제출과 동일한 검증 규칙을 서버에서 다시 적용한다.
 */
export async function updateLead(
  id: string,
  input: RawInput
): Promise<AdminActionResult> {
  if (!id) {
    return { ok: false, error: "잘못된 요청입니다." };
  }

  const validated = validateLeadInput(input);
  if (!validated.ok) {
    return validated;
  }

  try {
    await db.update(leads).set(validated.value).where(eq(leads.id, id));
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    console.error("updateLead 수정 실패:", err);
    return { ok: false, error: "수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }
}

/**
 * 리드를 삭제한다.
 */
export async function deleteLead(id: string): Promise<AdminActionResult> {
  if (!id) {
    return { ok: false, error: "잘못된 요청입니다." };
  }

  try {
    await db.delete(leads).where(eq(leads.id, id));
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    console.error("deleteLead 삭제 실패:", err);
    return { ok: false, error: "삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }
}

/**
 * 특정 리드에 메모를 추가한다. 서버 액션이 실제 신뢰 경계이므로 여기서도 검증한다.
 */
export async function addMemo(
  leadId: string,
  content: string
): Promise<AdminActionResult> {
  // 서버 액션은 조작된 요청도 받으므로 타입만 믿지 않고 런타임에 확인한다.
  if (!leadId || typeof content !== "string") {
    return { ok: false, error: "잘못된 요청입니다." };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { ok: false, error: "메모 내용을 입력해주세요." };
  }
  if (trimmed.length > MEMO_MAX_LENGTH) {
    return { ok: false, error: `메모는 ${MEMO_MAX_LENGTH}자 이내로 입력해주세요.` };
  }

  try {
    await db.insert(leadMemos).values({ leadId, content: trimmed });
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    console.error("addMemo 저장 실패:", err);
    return { ok: false, error: "메모 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }
}

/**
 * 메모를 삭제한다.
 */
export async function deleteMemo(id: string): Promise<AdminActionResult> {
  if (!id) {
    return { ok: false, error: "잘못된 요청입니다." };
  }

  try {
    await db.delete(leadMemos).where(eq(leadMemos.id, id));
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    console.error("deleteMemo 삭제 실패:", err);
    return { ok: false, error: "메모 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }
}
