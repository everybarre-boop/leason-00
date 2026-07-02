/**
 * 리드 입력 값 검증. 폼 제출(submitLead)과 수정(updateLead) 서버 액션에서 공용으로 쓴다.
 * "use server" 파일은 async 함수만 export할 수 있어, 동기 헬퍼는 이 일반 모듈에 둔다.
 */

export type RawInput = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 리드 입력 값을 trim·검증한다. 성공 시 정규화(trim)된 값을 함께 반환한다.
 */
export function validateLeadInput(
  input: RawInput
): { ok: true; value: RawInput } | { ok: false; error: string } {
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

  return { ok: true, value: { name, email, phone, message } };
}
