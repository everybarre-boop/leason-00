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
  // 서버 액션은 조작된 요청도 받을 수 있어 인자 자체가 객체가 아닐 수 있다.
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "잘못된 요청입니다." };
  }

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
  // 국내 전화번호는 숫자 9~11자리(02-123-4567 ~ 010-1234-5678).
  // 이 검증이 있어야 normalizePhone의 "매칭 실패 시 원본 유지" 폴백이 안전해진다.
  const phoneDigits = extractDigits(phone);
  if (phoneDigits.length < 9 || phoneDigits.length > 11) {
    return { ok: false, error: "올바른 전화번호 형식이 아닙니다." };
  }

  return { ok: true, value: { name, email, phone: normalizePhone(phone), message } };
}

/**
 * 전화번호를 010-1234-5678 형태로 정규화한다.
 * 입력에서 숫자만 뽑아낸 뒤 국번/앞자리/뒷자리로 나눠 하이픈으로 잇는다.
 */
function normalizePhone(phone: string): string {
  const digits = extractDigits(phone);
  // 서울 지역번호(02)를 먼저 분기한다. 자릿수만으로는 02와 010을 구분할 수 없어,
  // 일반 규칙을 먼저 적용하면 "0212345678"이 "021-234-5678"로 잘못 쪼개진다.
  const parts =
    digits.match(/^(02)(\d{3,4})(\d{4})$/) ?? digits.match(/^(\d{3})(\d{3,4})(\d{4})$/);
  // 형식을 알아볼 수 없으면 원본을 그대로 둔다(값을 잃지 않게).
  if (!parts) return phone;
  return `${parts[1]}-${parts[2]}-${parts[3]}`;
}

/** 전화번호에서 숫자만 뽑아낸다. */
function extractDigits(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}
