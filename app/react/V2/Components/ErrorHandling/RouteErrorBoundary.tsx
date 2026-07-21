import React from 'react';
import { useRouteError } from 'react-router';
import { captureException } from '@sentry/react';
import { ErrorFallback } from './ErrorFallback.js';
import {
  isChunkLoadError,
  tryChunkErrorReload,
  CHUNK_ERROR_KEY,
  normalizeRouteError,
} from '#V2/shared/errorUtils.js';

interface ErrorBoundaryProps {
  error?: Error;
  children?: React.ReactElement;
}

const RouteErrorBoundary = ({ error: elementError, children = <> </> }: ErrorBoundaryProps) => {
  const routeError = useRouteError();
  const rawError = elementError || routeError;
  const error = rawError ? normalizeRouteError(rawError) : undefined;

  React.useEffect(() => {
    if (isChunkLoadError(error) && tryChunkErrorReload()) return;
    if (error?.message) captureException(error);
  }, [error]);

  if (!error) {
    return children;
  }

  if (error?.message) {
    if (isChunkLoadError(error) && !sessionStorage.getItem(CHUNK_ERROR_KEY)) return null;
    return <ErrorFallback error={error} />;
  }
  return children;
};

export { RouteErrorBoundary };
