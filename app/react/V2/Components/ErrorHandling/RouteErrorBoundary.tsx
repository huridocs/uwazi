import React from 'react';
import { useRouteError } from 'react-router-dom';
import { ErrorFallback } from './ErrorFallback';

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
