import React from 'react';
import { useRouteError } from 'react-router';
import { captureException } from '@sentry/react';
import { ErrorFallback } from './ErrorFallback.js';
import { isChunkLoadError, tryChunkErrorReload, CHUNK_ERROR_KEY } from '#V2/shared/errorUtils.js';

interface ErrorBoundaryProps {
  error?: Error;
  children?: React.ReactElement;
}

const RouteErrorBoundary = ({ error: elementError, children = <> </> }: ErrorBoundaryProps) => {
  const routeError = useRouteError() as Error;
  const error = elementError || routeError;

  React.useEffect(() => {
    if (isChunkLoadError(error) && tryChunkErrorReload()) return;
    if (error?.message) captureException(error);
  }, [error]);

  if (error?.message) {
    if (isChunkLoadError(error) && !sessionStorage.getItem(CHUNK_ERROR_KEY)) return null;
    return <ErrorFallback error={error} />;
  }
  return children;
};

export { RouteErrorBoundary };
