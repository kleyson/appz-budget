/**
 * Simple utility to inject API key into HTML served to clients.
 */

import { config } from '../config';

export function injectApiKey(html: string, apiKey?: string): string {
  const key = apiKey ?? config.apiKey;
  const configScript = `<script>window.APP_CONFIG = ${JSON.stringify({ API_KEY: key })};</script>`;
  return html.replace('</head>', `${configScript}\n</head>`);
}
