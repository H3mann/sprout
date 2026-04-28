import { Request, Response, NextFunction } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../supabase';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

function buildOptionalAuth(client: SupabaseClient) {
  return async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const { data: { user } } = await client.auth.getUser(token);
        if (user) {
          req.userId = user.id;
        }
      } catch {
        // Invalid/expired token — continue without auth
      }
    }
    next();
  };
}

function buildRequireAuth(client: SupabaseClient) {
  return async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    try {
      const token = authHeader.slice(7);
      const { data: { user } } = await client.auth.getUser(token);

      if (!user) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
      }

      req.userId = user.id;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

export const optionalAuth = buildOptionalAuth(supabase);
export const requireAuth = buildRequireAuth(supabase);

export { buildOptionalAuth, buildRequireAuth };
