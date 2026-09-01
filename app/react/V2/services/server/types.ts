import type { IncomingHttpHeaders } from 'http';
import type { UserSchema } from '#shared/types/userType.js';

type ServerServiceContext = {
  user?: UserSchema;
  headers: IncomingHttpHeaders;
  language?: string;
};

export type { ServerServiceContext };
