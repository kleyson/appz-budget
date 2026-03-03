/**
 * JWT authentication middleware.
 *
 * Provides three middleware functions:
 * - jwtAuth: Required authentication (401 if invalid)
 * - optionalAuth: Optional authentication (never 401s)
 * - adminAuth: Requires admin role (403 if not admin)
 */

import type { Context, Next } from 'hono';
import { eq } from 'drizzle-orm';
import { decodeAccessToken } from '../utils/auth';
import { db } from '../db/connection';
import { users } from '../db/schema';

/**
 * Extract Bearer token from the Authorization header.
 * Returns null if the header is missing or not in Bearer format.
 */
function extractBearerToken(c: Context): string | null {
  const header = c.req.header('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  return header.slice(7);
}

/**
 * Look up the user display name (full_name or email) from the database.
 * Returns null if the user is not found or inactive.
 */
async function lookupUserName(userId: number): Promise<{ name: string; isAdmin: boolean } | null> {
  const [user] = await db
    .select({
      full_name: users.full_name,
      email: users.email,
      is_active: users.is_active,
      is_admin: users.is_admin,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || !user.is_active) {
    return null;
  }

  return {
    name: user.full_name || user.email,
    isAdmin: user.is_admin ?? false,
  };
}

/**
 * Required JWT authentication middleware.
 * Extracts userId from Bearer token and looks up user name from DB.
 * Sets `userId` and `userName` on the context.
 * Returns 401 if the token is missing, invalid, or the user is inactive.
 */
export async function jwtAuth(c: Context, next: Next) {
  const token = extractBearerToken(c);
  if (!token) {
    return c.json({ detail: 'Not authenticated' }, 401);
  }

  const payload = await decodeAccessToken(token);
  if (!payload) {
    return c.json({ detail: 'Invalid authentication credentials' }, 401);
  }

  const userId = payload.user_id as number | undefined;
  if (!userId) {
    return c.json({ detail: 'Invalid token payload' }, 401);
  }

  const userInfo = await lookupUserName(userId);
  if (!userInfo) {
    return c.json({ detail: 'User not found or inactive' }, 401);
  }

  c.set('userId', userId);
  c.set('userName', userInfo.name);

  await next();
}

/**
 * Optional JWT authentication middleware.
 * If a valid Bearer token is present, sets userId and userName on the context.
 * Falls back to X-User-Name header for userName if no valid token.
 * Never returns 401 — always calls next().
 */
export async function optionalAuth(c: Context, next: Next) {
  const token = extractBearerToken(c);

  if (token) {
    const payload = await decodeAccessToken(token);
    if (payload) {
      const userId = payload.user_id as number | undefined;
      if (userId) {
        const userInfo = await lookupUserName(userId);
        if (userInfo) {
          c.set('userId', userId);
          c.set('userName', userInfo.name);
          await next();
          return;
        }
      }
    }
  }

  // Fallback: use X-User-Name header for audit tracking (API-key-only auth)
  const headerUserName = c.req.header('X-User-Name');
  if (headerUserName) {
    c.set('userName', headerUserName);
  }

  await next();
}

/**
 * Admin authorization middleware.
 * Must be used after jwtAuth so that userId is already set.
 * Checks if the authenticated user has admin privileges.
 * Returns 403 if the user is not an admin.
 */
export async function adminAuth(c: Context, next: Next) {
  const userId = c.get('userId') as number | undefined;
  if (!userId) {
    return c.json({ detail: 'Not authenticated' }, 401);
  }

  const userInfo = await lookupUserName(userId);
  if (!userInfo || !userInfo.isAdmin) {
    return c.json({ detail: 'Admin access required' }, 403);
  }

  await next();
}
