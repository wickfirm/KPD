import nodemailer from "nodemailer";
import { resendConfigured, sendWithResend } from "@/lib/form-notify";

/// Turns a CMS file address into an absolute link a visitor can open from email.
export function brochureLink(origin: string, url: string) {
  const trimmed = url.trim();
  if (!trimmed || /^javascript:/i.test(trimmed) || /^data:/i.test(trimmed)) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (!trimmed.startsWith("/")) return "";
  try {
    return new URL(trimmed, origin).toString();
  } catch {
    return "";
  }
}

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.EMAIL_FROM);
}

export function brochureEmailConfigured() {
  return resendConfigured() || smtpConfigured();
}

/// Sends the brochure link to the visitor (Resend when RESEND_API_KEY is set, otherwise SMTP). Returns sent:false when mail is not configured.
export async function sendBrochureEmail(input: { to: string; name: string; projectName: string; downloadUrl: string }) {
  if (!brochureEmailConfigured()) return { sent: false as const, reason: "Email is not configured." };
  const safeName = input.name.replace(/[<>]/g, "");
  const safeProject = input.projectName.replace(/[<>]/g, "");
  const subject = `${safeProject} brochure`;
  const text = `Hello ${safeName},\n\nThank you for your interest in ${safeProject}. Download the brochure here:\n${input.downloadUrl}\n`;
  const html = `<p>Hello ${escapeHtml(safeName)},</p><p>Thank you for your interest in ${escapeHtml(safeProject)}. Download the brochure here:</p><p><a href="${escapeHtml(input.downloadUrl)}">${escapeHtml(input.downloadUrl)}</a></p>`;
  if (resendConfigured()) {
    await sendWithResend({ to: [input.to], subject, text, html, replyTo: process.env.EMAIL_REPLY_TO || undefined });
    return { sent: true as const };
  }
  const port = Number(process.env.SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "false" ? false : port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: input.to,
    replyTo: process.env.EMAIL_REPLY_TO || undefined,
    subject,
    text,
    html,
  });
  return { sent: true as const };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}
