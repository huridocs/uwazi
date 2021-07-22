import React from 'react';
import RouteHandler from 'app/App/RouteHandler';
import Helmet from 'react-helmet';
import { ErrorFallback } from 'app/App/ErrorHandling/ErrorFallback';

const handledErrors: { [k: string]: Error } = {
  400: {
    name: 'Bad Request',
    message: 'Error 400. The request could not be processed.',
  },
  404: {
    name: 'Not Found',
    message: '404',
  },
  500: {
    name: 'Unexpected error',
    message: 'Something went wrong',
  },
};

class GeneralError extends RouteHandler {
  render() {
    const code: string = this.props.params.errorCode;
    const { requestId } = this.props.location.query;
    const safeRequestId = /^[0-9-]{4}$/.exec(requestId);
    const error = handledErrors[code] || handledErrors['404'];
    return (
      <div>
        <Helmet title={error.name} />
        <ErrorFallback error={error} />
        {safeRequestId && <span>Request id #{safeRequestId}</span>}
      </div>
    );
  }
}

export default GeneralError;
