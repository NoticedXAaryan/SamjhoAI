import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { signAccess, signRefresh, verifyRefresh } from '../lib/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { sendVerificationEmail, sendPasswordResetEmail, logEmailLinkDev } from '../lib/email.js';

const router = Router();

// Rate limit: 5 login/register attempts per 60s per IP
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in a minute.' },
});

const resetLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in a few minutes.' },
});

router.use('/login', authLimiter);
router.use('/register', authLimiter);
router.use('/forgot-password', authLimiter);
router.use('/reset-password', resetLimiter);

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/\d/, 'Password must contain a number');

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().toLowerCase().trim(),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

function normalizeEmail(email: string): string {
  const lower = email.toLowerCase().trim();
  const [user, domain] = lower.split('@');
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return `${user.replace(/\./g, '')}@${domain}`;
  }
  return lower;
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.issues[0].message });
    return;
  }

  const { firstName, lastName, email: rawEmail, password } = parse.data;
  const email = normalizeEmail(rawEmail);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const user = await prisma.user.create({
    data: { email, name: `${firstName} ${lastName}`, passwordHash, emailVerificationToken: verificationToken },
  });

  // Log verification link in dev, send email in prod
  if (env.NODE_ENV === 'development') {
    const link = `${env.APP_ORIGIN}/auth?verified=true&token=${verificationToken}`;
    logEmailLinkDev('verify', user.email, link, 'Verify Email');
  }
  sendVerificationEmail(email, user.name, verificationToken).catch((e) =>
    console.log('[Auth] Email send failed (non-blocking):', e.message),
  );

  const payload = { userId: user.id, email: user.email };
  res.status(201).json({
    accessToken: signAccess(payload),
    refreshToken: signRefresh(payload),
    user: { id: user.id, name: user.name, email: user.email, emailVerified: false },
  });
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.issues[0].message });
    return;
  }

  const { email: rawEmail, password } = parse.data;
  const email = normalizeEmail(rawEmail);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    res.status(429).json({ error: 'Account is temporarily locked. Please try again later.' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const attempts = user.failedLoginAttempts + 1;
    const lockedUntil = attempts >= 5
      ? new Date(Date.now() + 15 * 60_000)
      : undefined;
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: attempts, lockedUntil },
    });
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  const payload = { userId: user.id, email: user.email };
  res.json({
    accessToken: signAccess(payload),
    refreshToken: signRefresh(payload),
    user: { id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified },
  });
});

// POST /api/auth/refresh
router.post('/refresh', (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }

  try {
    const payload = verifyRefresh(refreshToken);
    res.json({ accessToken: signAccess({ userId: payload.userId, email: payload.email }) });
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, name: true, email: true, emailVerified: true, avatarId: true, createdAt: true },
  });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.json({ success: true });
});

// POST /api/auth/send-verification
router.post('/send-verification', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  if (user.emailVerified) {
    res.json({ success: true, message: 'Email already verified' });
    return;
  }
  const token = user.emailVerificationToken || crypto.randomBytes(32).toString('hex');
  if (!user.emailVerificationToken) {
    await prisma.user.update({ where: { id: user.id }, data: { emailVerificationToken: token } });
  }

  if (env.NODE_ENV === 'development') {
    const link = `${env.APP_ORIGIN}/auth?verified=true&token=${token}`;
    logEmailLinkDev('verify', user.email, link, 'Verify Email');
  }
  await sendVerificationEmail(user.email, user.name, token);
  res.json({ success: true });
});

// GET /api/auth/verify-email?token=...
router.get('/verify-email', async (req: Request, res: Response) => {
  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'Verification token required' });
    return;
  }
  const user = await prisma.user.findFirst({ where: { emailVerificationToken: token } });
  if (!user) {
    res.status(400).json({ error: 'Invalid or expired verification token' });
    return;
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerificationToken: null },
  });
  res.redirect(`${env.APP_ORIGIN}/auth?verified=true`);
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email: rawEmail } = req.body;
  if (!rawEmail || typeof rawEmail !== 'string') {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  const email = normalizeEmail(rawEmail);
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 60_000);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    });

    if (env.NODE_ENV === 'development') {
      const link = `${env.APP_ORIGIN}/auth?reset=true&resetToken=${token}`;
      logEmailLinkDev('reset', user.email, link, 'Reset Password');
    }
    await sendPasswordResetEmail(email, token);
  }
  res.json({ success: true });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  const schema = z.object({
    token: z.string(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  });
  const parse = schema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.issues[0].message });
    return;
  }

  const { token, password } = parse.data;
  const user = await prisma.user.findFirst({
    where: { passwordResetToken: token, passwordResetExpires: { gt: new Date() } },
  });
  if (!user) {
    res.status(400).json({ error: 'Invalid or expired reset token' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpires: null, failedLoginAttempts: 0, lockedUntil: null },
  });

  res.json({ success: true });
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req: Request, res: Response) => {
  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
  });
  const parse = schema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.issues[0].message });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const valid = await bcrypt.compare(parse.data.currentPassword, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Current password is incorrect' });
    return;
  }

  const passwordHash = await bcrypt.hash(parse.data.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  res.json({ success: true });
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().min(1).optional(),
    avatarId: z.number().int().min(0).max(15).optional(),
  });
  const parse = schema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.issues[0].message });
    return;
  }

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: {
      ...(parse.data.name !== undefined ? { name: parse.data.name } : {}),
      ...(parse.data.avatarId !== undefined ? { avatarId: parse.data.avatarId } : {}),
    },
    select: { id: true, name: true, email: true, emailVerified: true, avatarId: true },
  });

  res.json(user);
});

export default router;
