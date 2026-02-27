/**
 * Email sending utility via Resend API.
 *
 * Requires: RESEND_API_KEY, RESEND_FROM_EMAIL (optional, defaults shown below).
 * In development with no API key, the email body is logged to the console.
 */

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(
  payload: EmailPayload,
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "Duet <noreply@duet.app>";

  if (!apiKey) {
    // Development fallback: log to console so the flow can be tested without email config.
    console.log("[email] RESEND_API_KEY not set — email not sent.");
    console.log(`  To:      ${payload.to}`);
    console.log(`  Subject: ${payload.subject}`);
    if (payload.text) {
      console.log(`  Body:    ${payload.text}`);
    }
    return { success: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[email] Resend error:", res.status, body);
      return { success: false, error: "Email delivery failed." };
    }

    return { success: true };
  } catch (err) {
    console.error("[email] Unexpected error:", err);
    return { success: false, error: "Email delivery failed." };
  }
}
