import React, { ErrorInfo, PropsWithChildren, ReactNode, useRef, useState } from 'react';
import { ErrorFallback } from 'app/App/ErrorHandling/ErrorFallback';

import * as Sentry from '@sentry/react';
import { useAtomValue } from 'jotai';
import { globalErrorsAtom } from 'app/V2/atoms/globalErrorsAtom';

interface ErrorBoundaryProps {
  error?: Error;
  errorInfo?: ErrorInfo;
  children?: ReactNode;
}

const defaultProps = {
  error: {},
  errorInfo: '',
  children: '',
};

const ErrorBoundary = ({ children, error }: ErrorBoundaryProps) => {
  const clientErrors = useAtomValue(globalErrorsAtom);
  const localError = useRef(error || clientErrors[0]);

  const onErrorHandle = errorEvent => {
    localError.current = errorEvent;
  };

  return (
    <Sentry.ErrorBoundary
      fallback={<ErrorFallback error={localError.current} />}
      onError={onErrorHandle}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
};

export { ErrorBoundary };
