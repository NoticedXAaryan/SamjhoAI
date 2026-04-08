import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { Prisma } from '@prisma/client';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { generateRefreshToken, hashToken, signAccess } from '../lib/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { sendVerificationEmail, sendPasswordResetEmail, logEmailLinkDev } from '../lib/email.js';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '../lib/jwt.js';

const router = Router();

// ── Cookie helpers ─────────────────────────────────────────────────────────
const isProd = env.NODE_ENV === 'production';

function isTransientDbError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientInitializationError) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("Can't reach database server") ||
    msg.includes('terminating connection due to administrator command') ||
    msg.includes('Timed out fetching a new connection')
  );
}

function setCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 min (access token)
    path: '/',
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (refresh token)
    path: '/',
  });
}

function clearCookies(res: Response) {
  const options = {
    path: '/',
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' as const : 'lax' as const,
  };
  res.clearCookie(ACCESS_COOKIE, options);
  res.clearCookie(REFRESH_COOKIE, options);
}

// ── Rate limiters ────────────────────────────────────────────────────────
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

// ── Schemas ──────────────────────────────────────────────────────────────
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

// ── POST /api/auth/register ──────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0].message });
      return;
    }

    const { firstName, lastName, email: rawEmail, password } = parse.data;
    const email = normalizeEmail(rawEmail);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Idempotent behavior for cold-start/network timeout scenarios:
      // if account already exists with the same password, treat this as login.
      const samePassword = await bcrypt.compare(password, existing.passwordHash);
      if (!samePassword) {
        res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
        return;
      }

      await prisma.user.update({
        where: { id: existing.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });

      const rawToken = generateRefreshToken();
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await prisma.refreshToken.create({
        data: { tokenHash, userId: existing.id, expiresAt },
      });

      const payload = { userId: existing.id, email: existing.email };
      setCookies(res, signAccess(payload), rawToken);
      res.status(200).json({
        user: {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          emailVerified: existing.emailVerified,
        },
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = await prisma.user.create({
      data: { email, name: `${firstName} ${lastName}`, passwordHash, emailVerificationToken: verificationToken },
    });

    // Send verification email (non-blocking)
    if (env.NODE_ENV === 'development') {
      const link = `${env.APP_ORIGIN}/api/auth/verify-email?token=${verificationToken}`;
      logEmailLinkDev('verify', user.email, link, 'Verify Email');
    }
    sendVerificationEmail(email, user.name, verificationToken).catch((err) => {
      console.error('[Auth] Verification email failed for', user.email, err instanceof Error ? err.message : String(err));
    });

    const rawToken = generateRefreshToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: { tokenHash, userId: user.id, expiresAt },
    });

    const payload = { userId: user.id, email: user.email };
    setCookies(res, signAccess(payload), rawToken);
    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, emailVerified: false } });
  } catch (err) {
    console.error('[Auth] Register error:', err);

    // Recovery path: registration may have created user but failed before response (cold start/DB hiccup).
    try {
      const fallbackEmailRaw = req.body?.email;
      const fallbackPasswordRaw = req.body?.password;
      if (typeof fallbackEmailRaw === 'string' && typeof fallbackPasswordRaw === 'string') {
        const email = normalizeEmail(fallbackEmailRaw);
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          const valid = await bcrypt.compare(fallbackPasswordRaw, existing.passwordHash);
          if (valid) {
            const rawToken = generateRefreshToken();
            const tokenHash = hashToken(rawToken);
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await prisma.refreshToken.create({
              data: { tokenHash, userId: existing.id, expiresAt },
            });
            const payload = { userId: existing.id, email: existing.email };
            setCookies(res, signAccess(payload), rawToken);
            res.status(200).json({
              user: {
                id: existing.id,
                name: existing.name,
                email: existing.email,
                emailVerified: existing.emailVerified,
              },
            });
            return;
          }
        }
      }
    } catch (recoveryErr) {
      console.error('[Auth] Register recovery failed:', recoveryErr);
    }

    if (isTransientDbError(err)) {
      res.status(503).json({ error: 'Service is waking up. Please retry in a few seconds.' });
      return;
    }
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
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

    const rawToken = generateRefreshToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: { tokenHash, userId: user.id, expiresAt },
    });

    const payload = { userId: user.id, email: user.email };
    setCookies(res, signAccess(payload), rawToken);
    res.json({ user: { id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified } });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    if (isTransientDbError(err)) {
      res.status(503).json({ error: 'Service is waking up. Please retry in a few seconds.' });
      return;
    }
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ── POST /api/auth/refresh (hash-based rotation) ─────────────────────────
router.post('/refresh', async (req: Request, res: Response) => {
  // Accept from httpOnly cookie or body (legacy fallback)
  const existingToken = (req.cookies as Record<string, string>)?.[REFRESH_COOKIE] ?? req.body.refreshToken;
  if (!existingToken) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }

  try {
    const existingHash = hashToken(existingToken);

    // Lookup stored token by hash
    const storedToken = await prisma.refreshToken.findFirst({
      where: { tokenHash: existingHash, revokedAt: null, expiresAt: { gt: new Date() } },
    });

    if (!storedToken) {
      // Token was rotated or revoked — potential theft, revoke all user tokens for safety
      // We can't know userId from the raw token, so just clear cookies
      clearCookies(res);
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    // Rotate: revoke old, issue new
    const rawToken = generateRefreshToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date(), replacedBy: tokenHash },
    });

    await prisma.refreshToken.create({
      data: { tokenHash, userId: storedToken.userId, expiresAt },
    });

    // Look up user for access token payload
    const user = await prisma.user.findUnique({
      where: { id: storedToken.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      clearCookies(res);
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const payload = { userId: user.id, email: user.email };
    setCookies(res, signAccess(payload), rawToken);
    res.json({ success: true });
  } catch (err) {
    console.error('[Auth] Refresh error:', err);
    clearCookies(res);
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, emailVerified: true, avatarId: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err) {
    console.error('[Auth] /me error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ── POST /api/auth/logout (revoke refresh token) ─────────────────────────
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const existingToken = (req.cookies as Record<string, string>)?.[REFRESH_COOKIE];
    if (existingToken) {
      const hash = hashToken(existingToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    clearCookies(res);
    res.json({ success: true });
  } catch (err) {
    console.error('[Auth] Logout error:', err);
    clearCookies(res);
    res.json({ success: true }); // Still log out even on DB error
  }
});

// ── POST /api/auth/send-verification ─────────────────────────────────────
router.post('/send-verification', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (user.emailVerified) {
      res.json({ success: true, message: 'Email already verified' });
      return;
    }
    const token = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({ where: { id: user.id }, data: { emailVerificationToken: token } });

    if (env.NODE_ENV === 'development') {
      const link = `${env.APP_ORIGIN}/api/auth/verify-email?token=${token}`;
      logEmailLinkDev('verify', user.email, link, 'Verify Email');
    }
    const emailOk = await sendVerificationEmail(user.email, user.name, token);
    if (!emailOk) {
      res.status(502).json({ error: 'Failed to send verification email' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Auth] Send verification error:', err);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

// ── GET /api/auth/verify-email ───────────────────────────────────────────
router.get('/verify-email', async (req: Request, res: Response) => {
  try {
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
  } catch (err) {
    console.error('[Auth] Verify email error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ── POST /api/auth/forgot-password ───────────────────────────────────────
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
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
      const emailOk = await sendPasswordResetEmail(email, token);
      if (!emailOk) {
        console.error('[Auth] Password reset email failed for', user.email);
      }
    }
    // Always return success to prevent email enumeration
    res.json({ success: true });
  } catch (err) {
    console.error('[Auth] Forgot password error:', err);
    res.json({ success: true }); // Don't reveal errors
  }
});

// ── POST /api/auth/reset-password ────────────────────────────────────────
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      token: z.string(),
      password: passwordSchema,
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

    // Revoke all existing refresh tokens (force re-login with new password)
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[Auth] Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ── POST /api/auth/change-password ───────────────────────────────────────
router.post('/change-password', requireAuth, async (req: Request, res: Response) => {
  try {
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
  } catch (err) {
    console.error('[Auth] Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ── PUT /api/auth/profile ────────────────────────────────────────────────
router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
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
  } catch (err) {
    console.error('[Auth] Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
