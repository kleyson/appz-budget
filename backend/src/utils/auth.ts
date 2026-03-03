/**
 * JWT and password utilities using jose and Bun.password.
 */

import * as jose from 'jose';
import { config } from '../config';

const secret = new TextEncoder().encode(config.jwt.secret);

export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, { algorithm: 'bcrypt', cost: 10 });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash);
}

export async function createAccessToken(
  data: Record<string, unknown>,
  expiresInMinutes?: number,
): Promise<string> {
  const minutes = expiresInMinutes ?? config.jwt.expireMinutes;
  return new jose.SignJWT(data)
    .setProtectedHeader({ alg: config.jwt.algorithm })
    .setExpirationTime(`${minutes}m`)
    .setIssuedAt()
    .sign(secret);
}

export async function decodeAccessToken(
  token: string,
): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function generateResetToken(): string {
  return crypto.randomUUID() + crypto.randomUUID();
}

export function generateShortCode(length = 6): string {
  const digits = '0123456789';
  let code = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (const byte of array) {
    code += digits[byte % 10];
  }
  return code;
}
