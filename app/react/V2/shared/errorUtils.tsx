import React from 'react';
import { captureException } from '@sentry/react';
import { getStore } from '#shared/atomStore/index.js';
import { isClient } from '#app/utils/index.js';
import { Translate } from '#app/I18N/index.js';
import { notificationAtom } from '#V2/atoms/index.js';

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
  json?: { error?: string; prettyMessage?: string };
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
  getStore().set(notificationAtom, () => ({
    type: 'error',
    text: <Translate>An error occurred</Translate>,
    details:
      'json' in error ? error.json?.prettyMessage || error.json?.error : error.message || undefined,
  }));
};

export {
  handledErrors,
  handleUnexpectedError,
  reportErrorToSentry,
  isChunkLoadError,
  tryChunkErrorReload,
  resetChunkErrorFlag,
  CHUNK_ERROR_KEY,
};
export type { RequestError };
