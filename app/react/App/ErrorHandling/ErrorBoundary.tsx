import React, { ErrorInfo } from 'react';
import { ErrorFallback } from 'app/App/ErrorHandling/ErrorFallback';

interface ErrorBoundaryProps {
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryProps> {
  
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: props.error, errorInfo: props.errorInfo };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.error?.message) {
      return (<ErrorFallback error = {this.state.error} errorInfo={this.state.errorInfo }/>)
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
