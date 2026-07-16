/**
 * 리드 제출 흐름 추적용 로거.
 * 하나의 제출을 traceId로 묶어 클라이언트 → 서버 액션 → 검증 → DB 저장까지 따라갈 수 있게 한다.
 */

export type Stage =
  | "client:submit"
  | "client:result"
  | "action:received"
  | "action:validated"
  | "db:insert"
  | "email:notify";

/**
 * 제출 1건을 식별하는 짧은 ID. 로그 상관관계 추적에만 쓰고 저장하지 않는다.
 * Math.random().toString(36)은 길이가 보장되지 않아(0.5 → "0.i") ID가 비거나
 * 1글자로 줄 수 있으므로 randomUUID를 쓴다.
 */
export function newTraceId(): string {
  return crypto.randomUUID().slice(0, 8);
}

/**
 * 단계별 로그를 한 줄로 남긴다.
 * detail에는 개인정보(이름/이메일/전화번호/문의 내용)를 절대 담지 않는다.
 */
export function logStage(
  traceId: string,
  stage: Stage,
  detail?: Record<string, unknown>
) {
  const parts = [`[lead:${traceId}]`, stage];
  if (detail && Object.keys(detail).length > 0) {
    parts.push(JSON.stringify(detail));
  }
  console.log(parts.join(" "));
}
