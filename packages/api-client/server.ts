import { createServerApiClient } from './infrastructure/createServerApiClient.js';

// The bundler maps this entry to server.browser.ts; this catches anything that slips past it.
if (typeof window !== 'undefined') {
  throw new Error('#api-client/server is server-only');
}

export { createServerApiClient };
