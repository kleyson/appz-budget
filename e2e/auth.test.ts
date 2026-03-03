import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { getApp, startServer, stopServer } from './setup';
import { apiHeaders, registerUser, loginUser, registerAndGetToken, httpRegisterUser, httpLoginUser, httpRegisterAndGetToken } from './helpers';
import type { Hono } from 'hono';

let app: Hono;

beforeAll(async () => {
  app = await getApp();
});

describe('Auth (Hono client)', () => {
  test('register a new user', async () => {
    const res = await registerUser(app, 'hono@test.com', 'pass123', 'Hono User');
    expect(res.status).toBe(201);
    const data = (await res.json()) as { id: number; email: string; full_name: string };
    expect(data.email).toBe('hono@test.com');
    expect(data.full_name).toBe('Hono User');
    expect(data).not.toHaveProperty('hashed_password');
  });

  test('register duplicate email fails', async () => {
    const res = await registerUser(app, 'hono@test.com', 'pass123');
    expect(res.status).toBe(400);
  });

  test('login with valid credentials', async () => {
    const res = await loginUser(app, 'hono@test.com', 'pass123');
    expect(res.status).toBe(200);
    const data = (await res.json()) as { access_token: string; token_type: string; email: string };
    expect(data.access_token).toBeDefined();
    expect(data.token_type).toBe('bearer');
    expect(data.email).toBe('hono@test.com');
  });

  test('login with wrong password fails', async () => {
    const res = await loginUser(app, 'hono@test.com', 'wrongpass');
    expect(res.status).toBe(401);
  });

  test('login with non-existent user fails', async () => {
    const res = await loginUser(app, 'nobody@test.com', 'pass123');
    expect(res.status).toBe(401);
  });

  test('GET /api/v1/auth/me returns current user', async () => {
    const token = await registerAndGetToken(app, 'me@test.com', 'pass123', 'Me User');
    const res = await app.request('/api/v1/auth/me', {
      headers: apiHeaders(token),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { email: string; full_name: string };
    expect(data.email).toBe('me@test.com');
    expect(data.full_name).toBe('Me User');
  });

  test('GET /api/v1/auth/me without token returns 401', async () => {
    const res = await app.request('/api/v1/auth/me', {
      headers: apiHeaders(),
    });
    expect(res.status).toBe(401);
  });

  test('change password', async () => {
    const token = await registerAndGetToken(app, 'chpw@test.com', 'oldpass', 'CHPW User');
    const res = await app.request('/api/v1/auth/change-password', {
      method: 'POST',
      headers: apiHeaders(token),
      body: JSON.stringify({ current_password: 'oldpass', new_password: 'newpass' }),
    });
    expect(res.status).toBe(200);

    // Verify new password works
    const loginRes = await loginUser(app, 'chpw@test.com', 'newpass');
    expect(loginRes.status).toBe(200);

    // Verify old password no longer works
    const oldLoginRes = await loginUser(app, 'chpw@test.com', 'oldpass');
    expect(oldLoginRes.status).toBe(401);
  });

  test('change password with wrong current password fails', async () => {
    const token = await registerAndGetToken(app, 'chpw2@test.com', 'mypass');
    const res = await app.request('/api/v1/auth/change-password', {
      method: 'POST',
      headers: apiHeaders(token),
      body: JSON.stringify({ current_password: 'wrong', new_password: 'newpass' }),
    });
    expect(res.status).toBe(400);
  });

  test('missing API key returns 403', async () => {
    const res = await app.request('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nokey@test.com', password: 'pass' }),
    });
    expect(res.status).toBe(403);
  });
});

describe('Auth (HTTP)', () => {
  let baseUrl: string;

  beforeAll(async () => {
    baseUrl = await startServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  test('register and login via HTTP', async () => {
    const regRes = await httpRegisterUser(baseUrl, 'http@test.com', 'pass123', 'HTTP User');
    expect(regRes.status).toBe(201);

    const loginRes = await httpLoginUser(baseUrl, 'http@test.com', 'pass123');
    expect(loginRes.status).toBe(200);
    const data = (await loginRes.json()) as { access_token: string };
    expect(data.access_token).toBeDefined();
  });

  test('GET /api/v1/auth/me via HTTP', async () => {
    const token = await httpRegisterAndGetToken(baseUrl, 'httpme@test.com', 'pass123', 'HTTP Me');
    const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: apiHeaders(token),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { email: string };
    expect(data.email).toBe('httpme@test.com');
  });
});
