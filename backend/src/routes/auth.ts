/**
 * Authentication and user management routes.
 * Ported from backend-python-archive/controllers/auth_controller.py
 * and backend-python-archive/services/user_service.py.
 */

import { Hono } from 'hono';
import { eq, and, gt } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';

import { db } from '../db/connection';
import { users, passwordResetTokens } from '../db/schema';
import { config } from '../config';
import {
  hashPassword,
  verifyPassword,
  createAccessToken,
  generateResetToken,
  generateShortCode,
} from '../utils/auth';
import { sendPasswordResetEmail } from '../utils/email';
import { apiKeyAuth } from '../middleware/api-key';
import { jwtAuth, adminAuth } from '../middleware/jwt';
import {
  userRegisterSchema,
  userLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  adminSetPasswordSchema,
  userCreateAdminSchema,
  userUpdateSchema,
} from '../types/schemas';

type Variables = {
  userId: number;
  userName: string;
};

const auth = new Hono<{ Variables: Variables }>();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

function stripPassword(user: {
  id: number;
  email: string;
  hashed_password: string;
  full_name: string | null;
  is_active: boolean | null;
  is_admin: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}) {
  const { hashed_password: _, ...rest } = user;
  return rest;
}

// ─── Public Auth Routes (API key only) ───────────────────────────────────────

// POST /api/v1/auth/register
auth.post(
  '/api/v1/auth/register',
  apiKeyAuth,
  zValidator('json', userRegisterSchema),
  async (c) => {
    const body = c.req.valid('json');

    // Check if user already exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);
    if (existing) {
      return c.json({ detail: 'User with this email already exists' }, 400);
    }

    const hashedPassword = await hashPassword(body.password);
    const timestamp = now();
    const createdBy = body.full_name || body.email;

    const [user] = await db
      .insert(users)
      .values({
        email: body.email,
        hashed_password: hashedPassword,
        full_name: body.full_name ?? null,
        is_active: true,
        is_admin: false,
        created_at: timestamp,
        updated_at: timestamp,
        created_by: createdBy,
        updated_by: createdBy,
      })
      .returning();

    return c.json(stripPassword(user), 201);
  },
);

// POST /api/v1/auth/login
auth.post(
  '/api/v1/auth/login',
  apiKeyAuth,
  zValidator('json', userLoginSchema),
  async (c) => {
    const body = c.req.valid('json');

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);

    if (!user) {
      return c.json({ detail: 'Invalid email or password' }, 401);
    }

    if (!user.is_active) {
      return c.json({ detail: 'User account is inactive' }, 401);
    }

    const valid = await verifyPassword(body.password, user.hashed_password);
    if (!valid) {
      return c.json({ detail: 'Invalid email or password' }, 401);
    }

    const accessToken = await createAccessToken({
      sub: user.email,
      user_id: user.id,
    });

    return c.json({
      access_token: accessToken,
      token_type: 'bearer',
      user_id: user.id,
      email: user.email,
    });
  },
);

// POST /api/v1/auth/forgot-password
auth.post(
  '/api/v1/auth/forgot-password',
  apiKeyAuth,
  zValidator('json', forgotPasswordSchema),
  async (c) => {
    const body = c.req.valid('json');

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1);

      if (!user) {
        return c.json({
          message: 'If the email exists, a password reset link has been sent',
          email_sent: false,
        });
      }

      // Generate tokens
      const token = generateResetToken();
      const shortCode = generateShortCode(config.passwordReset.codeLength);
      const expiresAt = new Date(
        Date.now() + config.passwordReset.codeExpirationMinutes * 60 * 1000,
      ).toISOString();

      await db.insert(passwordResetTokens).values({
        user_id: user.id,
        token,
        short_code: shortCode,
        expires_at: expiresAt,
        used: false,
        created_at: now(),
      });

      // Build reset URL
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

      // Log reset code
      console.warn(
        `\n` +
        `╔══════════════════════════════════════════════════════════════════╗\n` +
        `║                    PASSWORD RESET REQUEST                        ║\n` +
        `╠══════════════════════════════════════════════════════════════════╣\n` +
        `║ User Email:  ${body.email.padEnd(51)} ║\n` +
        `║ Reset Code:  ${shortCode.padEnd(51)} ║\n` +
        `║ Expires In:  ${String(config.passwordReset.codeExpirationMinutes).padEnd(43)} minutes ║\n` +
        `║ Reset URL:   ${resetUrl.slice(0, 51).padEnd(51)} ║\n` +
        `╚══════════════════════════════════════════════════════════════════╝`,
      );

      // Try to send email
      let emailSent = false;
      try {
        emailSent = await sendPasswordResetEmail(
          body.email,
          resetUrl,
          shortCode,
          config.passwordReset.codeExpirationMinutes,
        );
      } catch (err) {
        console.error('Failed to send password reset email:', err);
      }

      return c.json({
        message:
          'Password reset requested. Check your email or contact admin for reset code.',
        email_sent: emailSent,
      });
    } catch {
      // Always return success message for security
      return c.json({
        message: 'If the email exists, a password reset link has been sent',
        email_sent: false,
      });
    }
  },
);

// POST /api/v1/auth/reset-password
auth.post(
  '/api/v1/auth/reset-password',
  apiKeyAuth,
  zValidator('json', resetPasswordSchema),
  async (c) => {
    const body = c.req.valid('json');

    // Try long token first
    let [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, body.token))
      .limit(1);

    // If not found, try short code (if it looks like a numeric code)
    if (!resetToken && /^\d+$/.test(body.token)) {
      [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.short_code, body.token),
            eq(passwordResetTokens.used, false),
          ),
        )
        .limit(1);
    }

    if (!resetToken) {
      return c.json({ detail: 'Invalid or expired reset token' }, 400);
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      return c.json({ detail: 'Reset token has expired' }, 400);
    }

    if (resetToken.used) {
      return c.json({ detail: 'Reset token has already been used' }, 400);
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, resetToken.user_id))
      .limit(1);

    if (!user) {
      return c.json({ detail: 'User not found' }, 404);
    }

    // Update password
    const hashedPassword = await hashPassword(body.new_password);
    const updatedBy = user.full_name || user.email;
    await db
      .update(users)
      .set({
        hashed_password: hashedPassword,
        updated_at: now(),
        updated_by: updatedBy,
      })
      .where(eq(users.id, user.id));

    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, resetToken.id));

    console.info(`Password reset successful for user: ${user.email}`);

    return c.json({ message: 'Password reset successfully' });
  },
);

// ─── Protected Auth Routes (API key + JWT) ───────────────────────────────────

// GET /api/v1/auth/me
auth.get('/api/v1/auth/me', apiKeyAuth, jwtAuth, async (c) => {
  const userId = c.get('userId') as number;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return c.json({ detail: 'User not found' }, 404);
  }

  return c.json(stripPassword(user));
});

// POST /api/v1/auth/change-password
auth.post(
  '/api/v1/auth/change-password',
  apiKeyAuth,
  jwtAuth,
  zValidator('json', changePasswordSchema),
  async (c) => {
    const userId = c.get('userId') as number;
    const body = c.req.valid('json');

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return c.json({ detail: 'User not found' }, 404);
    }

    const valid = await verifyPassword(body.current_password, user.hashed_password);
    if (!valid) {
      return c.json({ detail: 'Current password is incorrect' }, 400);
    }

    const hashedPassword = await hashPassword(body.new_password);
    const updatedBy = user.full_name || user.email;
    await db
      .update(users)
      .set({
        hashed_password: hashedPassword,
        updated_at: now(),
        updated_by: updatedBy,
      })
      .where(eq(users.id, userId));

    return c.json({ message: 'Password changed successfully' });
  },
);

// ─── Admin Routes (API key + JWT + Admin) ────────────────────────────────────

// GET /api/v1/auth/users
auth.get('/api/v1/auth/users', apiKeyAuth, jwtAuth, adminAuth, async (c) => {
  const allUsers = await db.select().from(users);
  return c.json(allUsers.map(stripPassword));
});

// POST /api/v1/auth/users
auth.post(
  '/api/v1/auth/users',
  apiKeyAuth,
  jwtAuth,
  adminAuth,
  zValidator('json', userCreateAdminSchema),
  async (c) => {
    const body = c.req.valid('json');
    const adminName = c.get('userName') as string;

    // Check if user already exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);
    if (existing) {
      return c.json({ detail: 'User with this email already exists' }, 400);
    }

    const hashedPassword = await hashPassword(body.password);
    const timestamp = now();

    const [user] = await db
      .insert(users)
      .values({
        email: body.email,
        hashed_password: hashedPassword,
        full_name: body.full_name ?? null,
        is_active: body.is_active,
        is_admin: body.is_admin,
        created_at: timestamp,
        updated_at: timestamp,
        created_by: adminName,
        updated_by: adminName,
      })
      .returning();

    return c.json(stripPassword(user), 201);
  },
);

// GET /api/v1/auth/users/:id
auth.get('/api/v1/auth/users/:id', apiKeyAuth, jwtAuth, adminAuth, async (c) => {
  const userId = parseInt(c.req.param('id'), 10);

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user) {
    return c.json({ detail: 'User not found' }, 404);
  }

  return c.json(stripPassword(user));
});

// PUT /api/v1/auth/users/:id
auth.put(
  '/api/v1/auth/users/:id',
  apiKeyAuth,
  jwtAuth,
  adminAuth,
  zValidator('json', userUpdateSchema),
  async (c) => {
    const userId = parseInt(c.req.param('id'), 10);
    const body = c.req.valid('json');
    const adminName = c.get('userName') as string;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return c.json({ detail: 'User not found' }, 404);
    }

    // Check email uniqueness if email is being changed
    if (body.email && body.email !== user.email) {
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1);
      if (existing) {
        return c.json({ detail: 'User with this email already exists' }, 400);
      }
    }

    // Build update data, only including provided fields
    const updateData: Record<string, unknown> = {
      updated_at: now(),
      updated_by: adminName,
    };
    if (body.email !== undefined) updateData.email = body.email;
    if (body.full_name !== undefined) updateData.full_name = body.full_name;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.is_admin !== undefined) updateData.is_admin = body.is_admin;

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    return c.json(stripPassword(updated));
  },
);

// DELETE /api/v1/auth/users/:id
auth.delete(
  '/api/v1/auth/users/:id',
  apiKeyAuth,
  jwtAuth,
  adminAuth,
  async (c) => {
    const userId = parseInt(c.req.param('id'), 10);
    const currentUserId = c.get('userId') as number;

    // Prevent deleting yourself
    if (userId === currentUserId) {
      return c.json({ detail: 'Cannot delete your own account' }, 400);
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return c.json({ detail: 'User not found' }, 404);
    }

    await db.delete(users).where(eq(users.id, userId));

    return c.json({ message: 'User deleted successfully' });
  },
);

// POST /api/v1/auth/users/:id/set-password
auth.post(
  '/api/v1/auth/users/:id/set-password',
  apiKeyAuth,
  jwtAuth,
  adminAuth,
  zValidator('json', adminSetPasswordSchema),
  async (c) => {
    const userId = parseInt(c.req.param('id'), 10);
    const body = c.req.valid('json');
    const adminName = c.get('userName') as string;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return c.json({ detail: 'User not found' }, 404);
    }

    const hashedPassword = await hashPassword(body.new_password);
    await db
      .update(users)
      .set({
        hashed_password: hashedPassword,
        updated_at: now(),
        updated_by: adminName,
      })
      .where(eq(users.id, userId));

    console.info(`Admin ${adminName} set password for user: ${user.email}`);

    return c.json({ message: `Password set successfully for ${user.email}` });
  },
);

// POST /api/v1/auth/users/:id/generate-reset-link
auth.post(
  '/api/v1/auth/users/:id/generate-reset-link',
  apiKeyAuth,
  jwtAuth,
  adminAuth,
  async (c) => {
    const userId = parseInt(c.req.param('id'), 10);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return c.json({ detail: 'User not found' }, 404);
    }

    const token = generateResetToken();
    const shortCode = generateShortCode(config.passwordReset.codeLength);
    const expiresAt = new Date(
      Date.now() + config.passwordReset.codeExpirationMinutes * 60 * 1000,
    ).toISOString();

    await db.insert(passwordResetTokens).values({
      user_id: user.id,
      token,
      short_code: shortCode,
      expires_at: expiresAt,
      used: false,
      created_at: now(),
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    console.info(`Admin generated reset link for user: ${user.email}`);

    return c.json({
      user_email: user.email,
      reset_url: resetUrl,
      short_code: shortCode,
      expires_in_minutes: config.passwordReset.codeExpirationMinutes,
    });
  },
);

// GET /api/v1/auth/password-resets
auth.get(
  '/api/v1/auth/password-resets',
  apiKeyAuth,
  jwtAuth,
  adminAuth,
  async (c) => {
    const activeTokens = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expires_at, now()),
        ),
      );

    const results = [];
    for (const token of activeTokens) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, token.user_id))
        .limit(1);

      if (user) {
        const timeRemaining =
          (new Date(token.expires_at).getTime() - Date.now()) / 1000;
        const minutesRemaining =
          timeRemaining > 0 ? Math.floor(timeRemaining / 60) : 0;

        results.push({
          user_email: user.email,
          short_code: token.short_code,
          created_at: token.created_at,
          expires_at: token.expires_at,
          minutes_remaining: minutesRemaining,
        });
      }
    }

    return c.json(results);
  },
);

export default auth;
