import { IncomingHttpHeaders } from 'http';
import type { MediaPropertyContext } from '#shared/entitySave/types.js';

type ServiceRequestOptions = {
  headers?: IncomingHttpHeaders;
  notifySuccess?: boolean;
  signal?: AbortSignal;
  saveMediaContext?: MediaPropertyContext;
};

export type { ServiceRequestOptions };
