import { Request, Response, NextFunction } from 'express';
import { verifyAccess, TokenPayload } from '../lib/jwt.js';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    req.user = verifyAccess(token);
    next();
  } catch {
    res.status(401).json({ error: 'Token expired or invalid' });
  }
}
