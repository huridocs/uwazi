import type { Request } from 'express';
import { tenants } from '#api/tenants/index.js';
import type { UwaziCredentials } from '../../application/contracts/AIAssistantContracts.js';

const buildUwaziCredentials = (
  request: Request<any, any, any>,
  password: string
): UwaziCredentials | null => {
  const username = request.user?.username;
  if (!username) {
    return null;
  }

  const tenant = tenants.current();
  const instanceHost = tenant.domain || request.get('host');
  if (!instanceHost) {
    return null;
  }

  return {
    url: `${request.protocol}://${instanceHost}`,
    username,
    password,
  };
};

export { buildUwaziCredentials };
