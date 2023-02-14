import React, { ErrorInfo } from 'react';
import { ErrorFallback } from 'app/App/ErrorHandling/ErrorFallback';
import { useRouteError } from 'react-router-dom';
import { RequestError } from './ErrorUtils';

interface ErrorBoundaryProps {
  error?: RequestError;
  errorInfo?: ErrorInfo;
  children?: React.ReactElement;
}

const RouteErrorBoundary = ({
  error: elementError,
  errorInfo,
  children = <> </>,
}: ErrorBoundaryProps) => {
  const routeError = useRouteError() as RequestError;
  const error = elementError || routeError;
  if (error?.message) {
    return <ErrorFallback error={error} errorInfo={errorInfo} />;
  }
  return children;
};

export { RouteErrorBoundary };
