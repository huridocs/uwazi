import React, { ReactNode } from 'react';
import {
  handledErrors,
  isChunkLoadError,
  tryChunkErrorReload,
  normalizeRouteError,
} from '#V2/shared/errorUtils.js';
import type { RequestError } from '#V2/shared/errorUtils.js';
import { ErrorFallback } from './ErrorFallback.js';

interface ErrorBoundaryProps {
  error?: Error | RequestError;
  children?: ReactNode;
}

const defaultProps = {
  error: undefined,
  children: '',
};

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryProps> {
  static defaultProps = defaultProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: props.error };
  }

  componentDidCatch(e: Error) {
    if (isChunkLoadError(e) && tryChunkErrorReload()) return;
    this.setState({ error: e as RequestError });
  }

  render() {
    const rawError = this.props.error || this.state.error;
    if (rawError) {
      const currentError = normalizeRouteError(rawError) as RequestError;
      const error = handledErrors[currentError.status] || {
        ...currentError,
        message: (currentError.message =
          currentError.additionalInfo?.message ||
          currentError.message ||
          currentError.json?.error ||
          currentError.name),
      };

      return <ErrorFallback error={error} />;
    }
    return this.props.children;
  }
}

export type { ErrorBoundaryProps };
export { ErrorBoundary };
