"use server";

import { db } from "@/db";
import { leads } from "@/db/schema";

export type SubmitResult =
  | { ok: true }
  | { ok: false; error: string };

type RawInput = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 레슨 문의 폼 제출을 받아 leads 테이블에 저장한다.
 * 서버에서 다시 한 번 검증하므로 클라이언트 검증을 우회해도 안전하다.
 */
export async function submitLead(input: RawInput): Promise<SubmitResult> {
  const name = input.name?.trim() ?? "";
  const email = input.email?.trim() ?? "";
  const phone = input.phone?.trim() ?? "";
  const message = input.message?.trim() ?? "";

  if (!name || !email || !phone || !message) {
    return { ok: false, error: "모든 항목을 입력해주세요." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "올바른 이메일 형식이 아닙니다." };
  }
  if (name.length > 100 || email.length > 200 || phone.length > 50 || message.length > 2000) {
    return { ok: false, error: "입력 값이 너무 깁니다." };
  }

  try {
    await db.insert(leads).values({ name, email, phone, message });
    return { ok: true };
  } catch (err) {
    console.error("submitLead 저장 실패:", err);
    return { ok: false, error: "저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }
}
