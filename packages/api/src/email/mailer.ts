import nodemailer from "nodemailer";

// SMTP is optional. When unconfigured, the app runs in "dev mode": OTP codes
// are logged and surfaced to the client instead of emailed. Configure the
// SMTP_* vars (e.g. a Gmail app password) to deliver real emails.
const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT ?? 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM ?? (user ? `Vodeum <${user}>` : "Vodeum");

export const smtpConfigured = Boolean(host && user && pass);

const transport = smtpConfigured
  ? nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // 465 = implicit TLS, 587 = STARTTLS
      auth: { user, pass },
    })
  : null;

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  if (!transport) return; // dev mode — caller logs the code instead

  await transport.sendMail({
    from,
    to,
    subject: `Your Vodeum verification code: ${code}`,
    text: `Your Vodeum verification code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:420px;margin:auto">
        <h2 style="font-weight:600">Verify your Vodeum sign-in</h2>
        <p style="color:#52525b">Use the code below to continue. It expires in 10 minutes.</p>
        <div style="font-size:30px;font-weight:700;letter-spacing:8px;padding:16px 0">${code}</div>
        <p style="color:#a1a1aa;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
      </div>`,
  });
}
