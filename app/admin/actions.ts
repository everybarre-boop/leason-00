"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { leads } from "@/db/schema";
import { validateLeadInput, type RawInput } from "@/app/lead-validation";

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
