import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { verificationEmailTemplate, passwordResetEmailTemplate, devVerificationLink } from './email-templates.js';

let transporter: nodemailer.Transporter | null = null;

function hasTransportConfigured(): boolean {
  return !!(env.EMAIL_RESEND_API_KEY || env.SMTP_HOST);
}

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
    }
  }
  return transporter!;
}

// Verified senders — use onboarding@resend.dev by default until a domain is verified on Resend dashboard
const SENDER = env.EMAIL_FROM || 'onboarding@resend.dev';
const REPLY_TO = env.EMAIL_FROM ? null : 'noreply@samjho.ai';

export function logEmailLinkDev(type: 'verify' | 'reset', email: string, link: string, label: string): void {
  console.log(devVerificationLink(email, email, link, type === 'verify' ? 'Verify Email' : 'Reset Password'));
}

async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  if (!hasTransportConfigured()) {
    console.error('[Email] No email provider configured — cannot send email');
    return false;
  }
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
    return false;
  }
}

const APP_ORIGIN = env.APP_ORIGIN;

export async function sendVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
  return sendMail(
    email,
    'Samjho — Verify your email',
    verificationEmailTemplate(name, token, APP_ORIGIN),
  );
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  return sendMail(
    email,
    'Samjho — Reset your password',
    passwordResetEmailTemplate(token, APP_ORIGIN),
  );
}
