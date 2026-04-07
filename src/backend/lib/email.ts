import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (env.EMAIL_RESEND_API_KEY) {
      transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: { user: 'resend', pass: env.EMAIL_RESEND_API_KEY },
      });
    } else if (env.SMTP_HOST) {
      transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        secure: (env.SMTP_PORT || 587) === 465,
        auth: env.SMTP_USER && env.SMTP_PASS
          ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
          : undefined,
      });
    } else {
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: 'dev', pass: 'samjho' },
      });
      console.log('[Email] Using Ethereal test transport (dev mode)');
    }
  }
  return transporter;
}

// Verified senders — use onboarding@resend.dev by default until a domain is verified on Resend dashboard
const SENDER = env.EMAIL_FROM || 'onboarding@resend.dev';
const REPLY_TO = env.EMAIL_FROM ? null : 'noreply@samjho.ai';

export function logEmailLinkDev(type: 'verify' | 'reset', email: string, link: string, label: string): void {
  console.log(`[Email] 🔗 ${label} link for ${email}: ${link}`);
}

async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  const transport = getTransporter();
  try {
    const info = await transport.sendMail({
      from: SENDER,
      ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent "${subject}" to ${to} (resend.com/${info.messageId})`);
    return true;
  } catch (err: unknown) {
    console.error('[Email] Failed:', err instanceof Error ? err.message : String(err));
    // In dev, try to continue; in prod, return false so caller can react
    return env.NODE_ENV === 'development';
  }
}

const APP_ORIGIN = process.env.APP_ORIGIN || 'http://localhost:3000';

export async function sendVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
  const link = `${APP_ORIGIN}/auth?verified=true&token=${token}`;
  return sendMail(
    email,
    'Samjho — Verify your email',
    `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:2rem;text-align:center">
      <h2 style="margin:0 0 .5rem">Hi ${name}!</h2>
      <p style="color:#666;margin:0 0 1.5rem">Click the button below to verify your email address on Samjho.</p>
      <a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:.75rem 1.5rem;border-radius:12px;text-decoration:none;font-weight:600">Verify Email</a>
      <p style="color:#999;font-size:12px;margin-top:1.5rem">If you didn't create this account, ignore this email. This link never expires.</p>
    </div>`,
  );
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const link = `${APP_ORIGIN}/auth?reset=true&resetToken=${token}`;
  return sendMail(
    email,
    'Samjho — Reset your password',
    `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:2rem;text-align:center">
      <h2 style="margin:0 0 .5rem">Reset your password</h2>
      <p style="color:#666;margin:0 0 1.5rem">Click the button below to choose a new password. This link expires in 30 minutes.</p>
      <a href="${link}" style="display:inline-block;background:#ef4444;color:#fff;padding:.75rem 1.5rem;border-radius:12px;text-decoration:none;font-weight:600">Reset Password</a>
      <p style="color:#999;font-size:12px;margin-top:1.5rem">If you didn't request this, ignore it.</p>
    </div>`,
  );
}
