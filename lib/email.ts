import { Resend } from "resend";
import type { RawInput } from "@/app/lead-validation";

/**
 * Resend를 통한 리드 알림 메일 발송.
 * 새 레슨 문의가 접수되면 운영자에게 접수 내용을 메일로 보낸다.
 *
 * 환경변수:
 * - RESEND_API_KEY: Resend API 키 (필수)
 * - LEAD_NOTIFICATION_TO: 알림을 받을 운영자 이메일 (필수)
 * - LEAD_NOTIFICATION_FROM: 발신 주소. Resend에서 인증한 도메인이어야 한다.
 *   미설정 시 테스트용 onboarding@resend.dev 를 사용한다.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 리드 알림 메일을 발송한다.
 * 메일 실패가 리드 저장을 막지 않도록 예외를 던지지 않고 성공 여부만 반환한다.
 */
export async function sendLeadNotification(lead: RawInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFICATION_TO;
  // 빈 문자열("")도 미설정으로 보고 테스트 발신주소로 폴백한다(?? 는 빈 문자열을 통과시킨다).
  const from = process.env.LEAD_NOTIFICATION_FROM?.trim() || "onboarding@resend.dev";

  if (!apiKey || !to) {
    console.warn(
      "리드 알림 메일 건너뜀: RESEND_API_KEY 또는 LEAD_NOTIFICATION_TO 미설정"
    );
    return false;
  }

  try {
    const resend = new Resend(apiKey);

    const name = escapeHtml(lead.name);
    const email = escapeHtml(lead.email);
    const phone = escapeHtml(lead.phone);
    const message = escapeHtml(lead.message).replace(/\n/g, "<br />");

    const { error } = await resend.emails.send({
      from: `레슨 문의 <${from}>`,
      to,
      replyTo: lead.email,
      subject: `[레슨 문의] ${lead.name}님이 문의를 남겼습니다`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
          <h2 style="margin: 0 0 16px;">새 레슨 문의가 접수되었습니다</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 12px; background: #f4f4f5; font-weight: 600; width: 90px;">이름</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; background: #f4f4f5; font-weight: 600;">이메일</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">
                <a href="mailto:${email}">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; background: #f4f4f5; font-weight: 600;">전화번호</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${phone}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; background: #f4f4f5; font-weight: 600; vertical-align: top;">문의 내용</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${message}</td>
            </tr>
          </table>
        </div>
      `,
    });

    if (error) {
      console.error("리드 알림 메일 발송 실패:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("리드 알림 메일 발송 예외:", err);
    return false;
  }
}

/**
 * 예상치 못한 에러가 발생했을 때 운영자에게 알림 메일을 보낸다.
 * 리드 알림과 동일한 수신/발신 설정(LEAD_NOTIFICATION_TO / LEAD_NOTIFICATION_FROM)을 쓴다.
 * 알림 발송 자체의 실패가 원래 흐름을 막지 않도록 예외를 던지지 않고 성공 여부만 반환한다.
 */
export async function sendErrorNotification(
  context: string,
  error: unknown
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFICATION_TO;
  const from = process.env.LEAD_NOTIFICATION_FROM?.trim() || "onboarding@resend.dev";

  if (!apiKey || !to) {
    console.warn(
      "에러 알림 메일 건너뜀: RESEND_API_KEY 또는 LEAD_NOTIFICATION_TO 미설정"
    );
    return false;
  }

  const detail =
    error instanceof Error
      ? `${error.name}: ${error.message}\n\n${error.stack ?? "(스택 없음)"}`
      : String(error);

  try {
    const resend = new Resend(apiKey);

    const { error: sendError } = await resend.emails.send({
      from: `에러 알림 <${from}>`,
      to,
      subject: `[에러 알림] ${context}`,
      html: `
        <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; color: #111;">
          <h2 style="margin: 0 0 12px;">예상치 못한 에러가 발생했습니다</h2>
          <p style="margin: 0 0 12px; color: #555;">위치: <strong>${escapeHtml(context)}</strong></p>
          <pre style="background: #0b1020; color: #e5e7eb; padding: 16px; border-radius: 8px; white-space: pre-wrap; word-break: break-word; font-size: 12px; line-height: 1.5;">${escapeHtml(detail)}</pre>
        </div>
      `,
    });

    if (sendError) {
      console.error("에러 알림 메일 발송 실패:", sendError);
      return false;
    }
    return true;
  } catch (err) {
    console.error("에러 알림 메일 발송 예외:", err);
    return false;
  }
}
