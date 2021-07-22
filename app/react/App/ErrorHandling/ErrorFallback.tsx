import React, { ErrorInfo } from 'react';

interface ErrorFallbackProps {
  error: Error;
  errorInfo?: ErrorInfo;
}
export const ErrorFallback = (props: ErrorFallbackProps) => (
  <div>
    <h2>{props.error.message || 'Something went wrong'}</h2>
    {props.errorInfo && (
      <details style={{ whiteSpace: 'pre-wrap' }}>
        {props.error && props.error.toString()}
        <br />
        {props.errorInfo.componentStack}
      </details>
    )}
  </div>
);
