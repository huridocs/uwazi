import React from 'react';
import { useRouteError } from 'react-router';
import { captureException } from '@sentry/react';
import { ErrorFallback } from './ErrorFallback';

interface ErrorBoundaryProps {
  error?: Error;
  children?: React.ReactElement;
}

const RouteErrorBoundary = ({ error: elementError, children = <> </> }: ErrorBoundaryProps) => {
  const routeError = useRouteError() as Error;
  const error = elementError || routeError;
  captureException(error);
  if (error?.message) {
    return <ErrorFallback error={error} />;
  }
  return children;
};

export { RouteErrorBoundary };
