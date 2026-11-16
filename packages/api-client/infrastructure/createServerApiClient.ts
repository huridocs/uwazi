import type { Request } from 'express';

import type { ServerApiClient } from '../application/ServerApiClient.js';

function createServerApiClient(_pageRequest: Request): ServerApiClient {
  return {};
}

export { createServerApiClient };
