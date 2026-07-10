import { IncomingHttpHeaders } from 'http';

type ServiceRequestOptions = {
  headers?: IncomingHttpHeaders;
  notifySuccess?: boolean;
  signal?: AbortSignal;
};

export type { ServiceRequestOptions };
