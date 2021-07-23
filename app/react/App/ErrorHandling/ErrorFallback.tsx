import React, { ErrorInfo } from 'react';
import { RequestError } from 'app/App/ErrorHandling/ErrorUtils';

interface ErrorFallbackProps {
  error: RequestError;
  errorInfo?: ErrorInfo;
}
export const ErrorFallback = (props: ErrorFallbackProps) => (
  <div>
    <h2>
      {`${props.error.code ? `Error ${props.error.code}: ` : ''}${props.error.name ||
        'Something went wrong'}`}
    </h2>
    {props.error.code === 500 && props.error.requestId && (
      <span>Request id #{props.error.requestId}</span>
    )}
    {props.error.message && (
      <details style={{ whiteSpace: 'pre-wrap' }}>
        {props.error.message}
        <br />
        {props.errorInfo?.componentStack}
      </details>
    )}
  </div>
);
