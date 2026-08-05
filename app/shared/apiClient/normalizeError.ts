import { ApiError } from './ApiError.js';
import type { ApiErrorInit, ApiValidation } from './ApiError.js';
import { parseRetryAfterMs } from './retryPolicy.js';

const PROBLEM_JSON = 'application/problem+json';
const RETRYABLE_STATUSES = new Set([408, 429, 502, 503, 504]);
const LEGACY_KEYS = ['error', 'prettyMessage', 'message', 'requestId', 'validations', 'retryable'];
const PROBLEM_KEYS = [
  'type',
  'title',
  'status',
  'detail',
  'instance',
  'requestId',
  'retryable',
  'validations',
];

type ErrorJson = {
  error?: string;
  prettyMessage?: string;
  requestId?: string;
  message?: string;
  validations?: { instancePath: string; message: string }[];
  retryable?: boolean;
  [key: string]: unknown;
};

type ProblemDetails = {
  type: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  requestId?: string;
  retryable?: boolean;
  validations?: ApiValidation[];
};

type LegacyHttpError = Error & {
  status?: number;
  json?: ErrorJson;
  headers?: Headers;
  endpoint?: { method: string; url: string };
  cookie?: string;
  additionalInfo?: Record<string, unknown>;
};

type NormalizeBodyInput = {
  body: unknown;
  status: number;
  statusText: string;
  contentType: string | null;
  headers?: Headers;
  parseError?: boolean;
};

const isAbortError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'name' in error &&
  (error as { name: string }).name === 'AbortError';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isLegacyHttpError = (error: unknown): error is LegacyHttpError =>
  error instanceof Error && 'status' in error && 'json' in error;

const pickExtensions = (body: Record<string, unknown>, keys: string[]) => {
  const extensions: Record<string, unknown> = {};
  Object.keys(body).forEach(key => {
    if (!keys.includes(key)) extensions[key] = body[key];
  });
  return Object.keys(extensions).length > 0 ? extensions : undefined;
};

const inferRetryable = (status: number, explicit?: boolean) =>
  explicit !== undefined ? explicit : RETRYABLE_STATUSES.has(status);

const normalizeLegacyBody = (
  body: ErrorJson,
  status: number,
  statusText: string,
  headers?: Headers
): ApiErrorInit => ({
  kind: status === 0 ? 'network' : 'http',
  status,
  code: typeof body.error === 'string' ? body.error : undefined,
  title: statusText,
  detail: body.prettyMessage ?? body.message ?? body.error ?? statusText,
  requestId: body.requestId,
  retryable: inferRetryable(status, body.retryable),
  retryAfterMs: parseRetryAfterMs(headers?.get('Retry-After') ?? null),
  validations: body.validations,
  extensions: pickExtensions(body, LEGACY_KEYS),
});

const normalizeProblemDetails = (
  body: ProblemDetails,
  status: number,
  statusText: string,
  headers?: Headers
): ApiErrorInit => {
  const httpStatus = body.status ?? status;
  return {
    kind: 'http',
    status: httpStatus,
    code: body.type,
    title: body.title ?? statusText,
    detail: body.detail ?? statusText,
    instance: body.instance,
    requestId: body.requestId,
    retryable: inferRetryable(httpStatus, body.retryable),
    retryAfterMs: parseRetryAfterMs(headers?.get('Retry-After') ?? null),
    validations: body.validations,
    extensions: pickExtensions(body, PROBLEM_KEYS),
  };
};

const normalizeHttpErrorBody = ({
  body,
  status,
  statusText,
  contentType,
  headers,
  parseError,
}: NormalizeBodyInput): ApiErrorInit => {
  if (parseError) {
    return {
      kind: 'parse',
      status,
      code: 'invalid_json',
      title: statusText,
      detail: 'Response body is not valid JSON',
      retryable: false,
      retryAfterMs: parseRetryAfterMs(headers?.get('Retry-After') ?? null),
    };
  }

  if (contentType?.includes(PROBLEM_JSON)) {
    if (isRecord(body) && typeof body.type === 'string') {
      return normalizeProblemDetails(body as ProblemDetails, status, statusText, headers);
    }
  } else if (isRecord(body)) {
    return normalizeLegacyBody(body as ErrorJson, status, statusText, headers);
  }

  return {
    kind: status === 0 ? 'network' : 'http',
    status,
    title: statusText,
    detail: statusText,
    retryable: inferRetryable(status),
    retryAfterMs: parseRetryAfterMs(headers?.get('Retry-After') ?? null),
  };
};

const buildApiError = (
  init: ApiErrorInit,
  endpoint?: { method: string; url: string },
  headers?: Headers,
  cookie?: string
) =>
  new ApiError(init.detail ?? init.title ?? 'Request failed', {
    ...init,
    endpoint,
    headers,
    cookie,
  });

const fromLegacyHttpError = (error: LegacyHttpError): ApiError =>
  buildApiError(
    normalizeHttpErrorBody({
      body: error.json,
      status: error.status ?? 500,
      statusText: error.message,
      contentType: error.headers?.get('Content-Type') ?? null,
      headers: error.headers,
      parseError: error.additionalInfo?.parseError === true,
    }),
    error.endpoint,
    error.headers,
    error.cookie
  );

const kindError = (
  kind: 'network' | 'cancelled' | 'timeout',
  message: string,
  retryable: boolean,
  endpoint?: { method: string; url: string }
) =>
  new ApiError(message, {
    kind,
    status: 0,
    code: kind === 'network' ? 'network_error' : kind,
    detail: message,
    retryable,
    endpoint,
  });

const cancelledError = (endpoint?: { method: string; url: string }) =>
  kindError('cancelled', 'Request cancelled', false, endpoint);

const timeoutError = (endpoint?: { method: string; url: string }) =>
  kindError('timeout', 'Request timed out', true, endpoint);

const toApiError = (error: unknown, endpoint?: { method: string; url: string }): ApiError => {
  if (error instanceof ApiError) return error;
  if (isLegacyHttpError(error)) return fromLegacyHttpError(error);
  if (isAbortError(error)) return cancelledError(endpoint);
  if (error instanceof TypeError) {
    return kindError('network', 'Could not reach server. Please try again later.', true, endpoint);
  }
  throw error;
};

export {
  buildApiError,
  cancelledError,
  isAbortError,
  isLegacyHttpError,
  normalizeHttpErrorBody,
  timeoutError,
  toApiError,
};
