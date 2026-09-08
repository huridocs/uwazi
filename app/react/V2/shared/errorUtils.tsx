import { captureException } from '@sentry/react';
import { data as routeData, isRouteErrorResponse } from 'react-router';
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
  503: {
    name: 'Service busy',
    message: 'The service is temporarily busy. Please try again in a moment.',
    status: 503,
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

const throwApiError = (error: ApiError): never => {
  throw routeData(
    {
      message: error.detail ?? error.message,
      error: error.code,
      requestId: error.requestId,
      validations: error.validations,
    },
    {
      status: error.status,
      statusText: handledErrors[error.status]?.name ?? error.title ?? error.name,
    }
  );
};

const messageFromRouteData = (data: unknown): string | undefined => {
  if (typeof data === 'string' && data.trim()) return data;
  if (typeof data === 'object' && data !== null) {
    if ('message' in data && typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }
    if ('error' in data && typeof data.error === 'string' && data.error.trim()) {
      return data.error;
    }
  }
  return undefined;
};

const responseToRequestError = (
  status: number,
  statusText: string,
  data?: unknown
): RequestError => {
  const message =
    messageFromRouteData(data) ||
    statusText ||
    handledErrors[status]?.message ||
    'Something went wrong';
  const mapped: RequestError = Object.assign(new Error(message), {
    status,
    name: handledErrors[status]?.name ?? (statusText || 'Error'),
  });
  if (typeof data === 'object' && data !== null) {
    mapped.json = {
      error: 'error' in data && typeof data.error === 'string' ? data.error : undefined,
      prettyMessage:
        'message' in data && typeof data.message === 'string' ? data.message : undefined,
      requestId:
        'requestId' in data && typeof data.requestId === 'string' ? data.requestId : undefined,
    };
    if (mapped.json.requestId) {
      mapped.requestId = mapped.json.requestId;
    }
  }
  return mapped;
};

const normalizeRouteError = (error: unknown): Error | RequestError => {
  if (isApiError(error)) {
    return apiErrorToRequestError(error);
  }
  if (isRouteErrorResponse(error)) {
    return responseToRequestError(error.status, error.statusText, error.data);
  }
  if (typeof Response !== 'undefined' && error instanceof Response) {
    return responseToRequestError(error.status, error.statusText);
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
  throwApiError,
  normalizeRouteError,
};
export type { RequestError };
