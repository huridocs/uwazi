import React from 'react';
import { captureException } from '@sentry/react';
import { isClient } from 'app/utils';
import { Translate } from 'app/I18N';
import { notificationAtom, atomStore } from 'app/V2/atoms';

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

const handleUnexpectedError = (error: Error | RequestError, key: string) => {
  reportErrorToSentry(error, key);
  atomStore.set(notificationAtom, () => ({
    type: 'error',
    text: <Translate>An error occurred</Translate>,
    details:
      'json' in error ? error.json?.prettyMessage || error.json?.error : error.message || undefined,
  }));
};

export { handledErrors, handleUnexpectedError, reportErrorToSentry };
export type { RequestError };
