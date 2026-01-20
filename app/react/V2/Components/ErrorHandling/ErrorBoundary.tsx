import React, { ReactNode } from 'react';
import { handledErrors } from '#V2/shared/errorUtils.jsx';
import type { RequestError } from '#V2/shared/errorUtils.jsx';
import { ErrorFallback } from '#V2/Components/ErrorHandling/ErrorFallback.jsx';

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
    const currentError = e as RequestError;
    this.setState({
      error: currentError,
    });
  }

  render() {
    const currentError = (this.props.error || this.state.error) as RequestError;
    if (currentError) {
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
