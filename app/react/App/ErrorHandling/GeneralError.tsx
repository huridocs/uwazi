import React from 'react';
import RouteHandler from 'app/App/RouteHandler';
import { Helmet } from 'react-helmet';
import { ErrorFallback } from 'app/App/ErrorHandling/ErrorFallback';
import { RequestError } from 'app/App/ErrorHandling/ErrorUtils';
import Footer from 'app/App/Footer';

const handledErrors: { [k: string]: RequestError } = {
  400: {
    title: 'Bad Request',
    summary: 'Bad Request',
    name: 'The request could not be processed.',
    message: '',
    code: '400',
  },
  404: {
    title: 'Not Found',
    summary: '',
    name: 'We can’t find the page you’re looking for. ',
    message: '',
    code: '404',
  },
  500: {
    title: 'Unexpected error',
    summary: 'Unexpected error',
    name: '',
    message: '',
    code: '500',
  },
};

class GeneralError extends RouteHandler {
  render() {
    const code: string = handledErrors[this.props.params.errorCode]?.code || '404';
    const { requestId } = this.props.location.query;
    const safeRequestId = /^[0-9-]{4}$/.exec(requestId);
    const error = handledErrors[code];
    error.requestId = safeRequestId ? safeRequestId[0] : undefined;
    return (
      <div>
        <Helmet>
          <title>{error.title}</title>
        </Helmet>
        <ErrorFallback error={error} />
        <Footer />
      </div>
    );
  }
}

export default GeneralError;
