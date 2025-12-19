// Version is injected at build time by Vite
// Vite's define will replace __APP_VERSION__ with the actual version string at build time
declare const __APP_VERSION__: string;

// Vite replaces __APP_VERSION__ with the actual version string during build
// The fallback 'unknown' should never be used in production builds, but provides safety
export const APP_VERSION: string = __APP_VERSION__ || 'unknown';
