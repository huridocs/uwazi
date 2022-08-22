import React, { ErrorInfo } from 'react';
import { RequestError } from 'app/App/ErrorHandling/ErrorUtils';
import { Translate } from 'app/I18N';

interface ErrorFallbackProps {
  error: RequestError;
  errorInfo?: ErrorInfo;
}
export const ErrorFallback = (props: ErrorFallbackProps) => {
  const showRequestId = props.error.code?.toString() === '500' && props.error.requestId;
  const errorDetails = props.errorInfo?.componentStack || props.error.message;
  return (
    <div className="error-fallback-ui">
      <div className="message">
        <p className="error-message-xxl">
          {props.error.summary || <Translate>Well, this is awkward...</Translate>}
        </p>
        <p className="error-message-lg">
          {props.error.name || <Translate>Something went wrong</Translate>}
        </p>
        <p>
          <Translate>Please contact an admin for details.</Translate>
        </p>
        {showRequestId && (
          <p className="error-message-sm">
            <Translate>Request id #</Translate>
            {props.error.requestId}
          </p>
        )}
        {errorDetails && <details className="error-details">{errorDetails}</details>}
      </div>
      {props.error.code && <span className="error-code">{props.error.code}</span>}
    </div>
  );
};
