import { captureException } from '@sentry/react';
import { ApiError } from '#shared/apiClient/index.js';
import { isClient } from '#app/utils/index.js';
import { notify as notifyBridge } from '#V2/utils/notifyBridge.js';

const handledErrors: { [k: string]: RequestError } = {
  400: {
    name: 'Bad Request',
    message: 'The request could not be processed.',
    status: 400,
  },
  404: {
    name: 'Not Found',
    message: "We can't find the page you're looking for.",
    status: 404,
  },
  500: {
    name: 'Unexpected error',
    message: 'Something went wrong',
    status: 500,
  },
};

interface RequestError extends Error {
  status: number;
  message: string;
  name: string;
  requestId?: string;
  endpoint?: string;
  headers?: {};
  json?: {
    error?: string;
    prettyMessage?: string;
    requestId?: string;
    validations?: { instancePath: string; message: string }[];
  };
  additionalInfo?: { message: string; ok: boolean };
}

const reportErrorToSentry = (error: Error, key: string) => {
  if (isClient) {
    const sentryError = new Error(key, { cause: error });
    captureException(sentryError);
  }
};

const CHUNK_ERROR_KEY = 'chunk-error-refreshed';

const isChunkLoadError = (error: Error | null | undefined): boolean =>
  Boolean(
    error && (error.name === 'ChunkLoadError' || /Loading chunk \d+ failed/.test(error.message))
  );

const tryChunkErrorReload = (): boolean => {
  const refreshed = sessionStorage.getItem(CHUNK_ERROR_KEY);
  if (!refreshed) {
    sessionStorage.setItem(CHUNK_ERROR_KEY, 'true');
    window.location.reload();
    return true;
  }
  return false;
};

const resetChunkErrorFlag = (): void => {
  sessionStorage.removeItem(CHUNK_ERROR_KEY);
};

const handleUnexpectedError = (error: Error | RequestError, key: string) => {
  reportErrorToSentry(error, key);
  const details =
    'json' in error ? error.json?.prettyMessage || error.json?.error : error.message || undefined;
  notifyBridge('An error occurred', 'error', undefined, details);
};

const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

const isRouteHttpError = (error: unknown): error is RequestError =>
  error instanceof Error && 'status' in error;

const apiErrorToRequestError = (error: ApiError): RequestError => {
  const mapped: RequestError = Object.assign(new Error(error.detail ?? error.message), {
    status: error.status,
    name: handledErrors[error.status]?.name ?? error.title ?? error.name,
    requestId: error.requestId,
    endpoint: error.endpoint?.url,
    headers: error.headers,
    stack: error.stack,
    additionalInfo: undefined,
  });

  mapped.json = {
    error: error.code,
    prettyMessage: error.detail,
    requestId: error.requestId,
    validations: error.validations,
  };
  return mapped;
};

const normalizeRouteError = (error: unknown): Error | RequestError => {
  if (isApiError(error)) {
    return apiErrorToRequestError(error);
  }
  if (error instanceof Error) {
    return error as RequestError;
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return error as RequestError;
  }
  return new Error(String(error));
};

export {
  handledErrors,
  handleUnexpectedError,
  reportErrorToSentry,
  isChunkLoadError,
  tryChunkErrorReload,
  resetChunkErrorFlag,
  CHUNK_ERROR_KEY,
  isApiError,
  isRouteHttpError,
  apiErrorToRequestError,
  normalizeRouteError,
};
export type { RequestError };
