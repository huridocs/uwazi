import React, { ErrorInfo } from 'react';
import { RequestError } from 'app/App/ErrorHandling/ErrorUtils';
import { Translate } from 'app/I18N';

interface ErrorFallbackProps {
  error: RequestError;
  errorInfo?: ErrorInfo;
}
export const ErrorFallback = (props: ErrorFallbackProps) => (
  <>
    <div className="error-fallback-ui">
      <div className="message">
        <p className="error-message-xxl">
          {props.error.title || <Translate>Well, this is awkward...</Translate>}
        </p>
        <p className="error-message-lg">
          {props.error.name || <Translate>Something went wrong</Translate>}
        </p>
        <p className="error-message-lg">
          <Translate>Please contact an admin for details.</Translate>
        </p>
        {props.error.code === '500' && props.error.requestId && (
          <p className="error-message-sm">Request id #{props.error.requestId}</p>
        )}
        {(props.error.stack || props.error.message) && (
          <details className="error-details">
            {props.errorInfo?.componentStack || props.error.message}
          </details>
        )}
      </div>
      {props.error.code && <span className="error-code">{props.error.code}</span>}
    </div>
  </>
);
