import { Request, Response, NextFunction } from 'express';
import { verifyAccess, TokenPayload, ACCESS_COOKIE } from '../lib/jwt.js';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Try Authorization header first, then httpOnly cookie
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else {
    token = (req.cookies as Record<string, string>)?.[ACCESS_COOKIE];
  }

  if (!token) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  try {
    req.user = verifyAccess(token);
    next();
  } catch {
    res.status(401).json({ error: 'Token expired or invalid' });
  }
}
