/**
 * CORS middleware configuration.
 * In development, allows localhost origins. In production, allows all origins.
 */

import { cors } from 'hono/cors';
import { isDev } from '../config';

export const corsMiddleware = cors({
  origin: isDev ? ['http://localhost:3000', 'http://localhost:5173'] : '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-User-Name', 'X-Client-Info'],
  credentials: true,
});
