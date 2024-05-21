import React from 'react';
import { ErrorFallback } from 'app/App/ErrorHandling/ErrorFallback';
import { useRouteError } from 'react-router-dom';

interface ErrorBoundaryProps {
  error?: Error;
  children?: React.ReactElement;
}

const RouteErrorBoundary = ({ error: elementError, children = <> </> }: ErrorBoundaryProps) => {
  const routeError = useRouteError() as Error;
  const error = elementError || routeError;
  if (error?.message) {
    return <ErrorFallback error={error} />;
  }
  return children;
};

export { RouteErrorBoundary };
