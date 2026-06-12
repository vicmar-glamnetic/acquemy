import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? "placeholder");
  return _resend;
}

export async function sendEmail({ to, subject, html, from }: {
  to: string; subject: string; html: string; from?: string;
}) {
  return getResend().emails.send({ from: from ?? process.env.RESEND_FROM ?? "LeadPilot <noreply@leadpilot.app>", to, subject, html });
}
