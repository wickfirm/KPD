import nodemailer from "nodemailer";

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

export function brochureEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.EMAIL_FROM);
}

/// Sends the brochure link to the visitor. Returns sent:false when mail is not configured.
export async function sendBrochureEmail(input: { to: string; name: string; projectName: string; downloadUrl: string }) {
  if (!brochureEmailConfigured()) return { sent: false as const, reason: "Email is not configured." };
  const port = Number(process.env.SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "false" ? false : port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  const safeName = input.name.replace(/[<>]/g, "");
  const safeProject = input.projectName.replace(/[<>]/g, "");
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: input.to,
    replyTo: process.env.EMAIL_REPLY_TO || undefined,
    subject: `${safeProject} brochure`,
    text: `Hello ${safeName},\n\nThank you for your interest in ${safeProject}. Download the brochure here:\n${input.downloadUrl}\n`,
    html: `<p>Hello ${escapeHtml(safeName)},</p><p>Thank you for your interest in ${escapeHtml(safeProject)}. Download the brochure here:</p><p><a href="${escapeHtml(input.downloadUrl)}">${escapeHtml(input.downloadUrl)}</a></p>`,
  });
  return { sent: true as const };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}
