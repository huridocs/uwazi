type ApiErrorKind = 'network' | 'timeout' | 'http' | 'parse' | 'cancelled';

type ApiValidation = {
  instancePath: string;
  message: string;
  keyword?: string;
};

type ApiEndpoint = {
  method: string;
  url: string;
};

type ApiErrorInit = {
  kind: ApiErrorKind;
  status: number;
  code?: string;
  title?: string;
  detail?: string;
  requestId?: string;
  instance?: string;
  retryable?: boolean;
  retryAfterMs?: number;
  validations?: ApiValidation[];
  extensions?: Record<string, unknown>;
  endpoint?: ApiEndpoint;
  headers?: Headers;
  cookie?: string;
};

class ApiError extends Error {
  kind: ApiErrorKind;

  status: number;

  code?: string;

  title?: string;

  detail?: string;

  requestId?: string;

  instance?: string;

  retryable?: boolean;

  retryAfterMs?: number;

  validations?: ApiValidation[];

  extensions?: Record<string, unknown>;

  endpoint?: ApiEndpoint;

  headers?: Headers;

  cookie?: string;

  constructor(message: string, init: ApiErrorInit) {
    super(message);
    this.name = 'ApiError';
    this.kind = init.kind;
    this.status = init.status;
    this.code = init.code;
    this.title = init.title;
    this.detail = init.detail;
    this.requestId = init.requestId;
    this.instance = init.instance;
    this.retryable = init.retryable;
    this.retryAfterMs = init.retryAfterMs;
    this.validations = init.validations;
    this.extensions = init.extensions;
    this.endpoint = init.endpoint;
    this.headers = init.headers;
    this.cookie = init.cookie;
  }
}

export { ApiError };
export type { ApiErrorInit, ApiErrorKind, ApiEndpoint, ApiValidation };
