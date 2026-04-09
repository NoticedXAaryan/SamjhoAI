import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { verificationEmailTemplate, passwordResetEmailTemplate, devVerificationLink } from './email-templates.js';

let transporter: nodemailer.Transporter | null = null;
let transporterVerified = false;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.SMTP_USER, // your gmail
        pass: env.SMTP_PASS, // app password
      },
    });
  }
  return transporter;
}

const SENDER = env.EMAIL_FROM || env.SMTP_USER;
const REPLY_TO = env.EMAIL_FROM;

export function logEmailLinkDev(
  type: 'verify' | 'reset',
  email: string,
  link: string
): void {
  console.log(
    devVerificationLink(
      email,
      email,
      link,
      type === 'verify' ? 'Verify Email' : 'Reset Password'
    )
  );
}

async function sendMail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const transport = getTransporter();

  try {
    if (!transporterVerified) {
      await transport.verify();
      transporterVerified = true;
    }

    const info = await transport.sendMail({
      from: SENDER,
      replyTo: REPLY_TO,
      to,
      subject,
      html,
    });

    console.log(`[Email] Sent "${subject}" to ${to} (${info.messageId})`);
    return true;
  } catch (err: unknown) {
    console.error(
      '[Email] Failed:',
      err instanceof Error ? err.message : String(err)
    );
    return false;
  }
}

const APP_ORIGIN = env.APP_ORIGIN;

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  return sendMail(
    email,
    'Samjho — Verify your email',
    verificationEmailTemplate(name, token, APP_ORIGIN)
  );
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<boolean> {
  return sendMail(
    email,
    'Samjho — Reset your password',
    passwordResetEmailTemplate(token, APP_ORIGIN)
  );
}