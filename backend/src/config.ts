/**
 * Environment configuration module.
 * Loads from environment variables with sensible defaults.
 */

function env(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const config = {
  env: env('ENV', 'production'),
  port: parseInt(env('PORT', '8000')),
  apiKey: env('API_KEY', 'dev-api-key'),
  jwt: {
    secret: env('JWT_SECRET_KEY', 'dev-secret-change-in-production'),
    expireMinutes: 30 * 24 * 60, // 30 days
    algorithm: 'HS256' as const,
  },
  database: {
    path: env('DATABASE_PATH', './data/budget.db'),
  },
  smtp: {
    enabled: !!process.env.SMTP_HOST,
    host: env('SMTP_HOST', ''),
    port: parseInt(env('SMTP_PORT', '587')),
    user: env('SMTP_USER', ''),
    password: env('SMTP_PASSWORD', ''),
    from: env('SMTP_FROM', 'noreply@budget.local'),
    useTls: env('SMTP_USE_TLS', 'true') === 'true',
  },
  passwordReset: {
    codeLength: parseInt(env('RESET_CODE_LENGTH', '6')),
    codeExpirationMinutes: parseInt(env('RESET_CODE_EXPIRATION_MINUTES', '30')),
    tokenExpirationHours: parseInt(env('RESET_TOKEN_EXPIRATION_HOURS', '24')),
  },
} as const;

export const isDev = config.env === 'development';
