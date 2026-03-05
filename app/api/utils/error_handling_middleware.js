import { handleError } from './handleError.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { ClientAbortedRequestError } from '#api/common.v2/errors/ClientAbortedRequestError.js';

// eslint-disable-next-line import/no-default-export, consistent-return
export default (error, req, res, next) => {
  if (res.headersSent) {
    if (!(error instanceof ClientAbortedRequestError)) {
      LoggerFactory.default().debug('Headers already sent when error middleware called', {
        namespace: 'Error_Middleware',

        url: req.url,
        method: req.method,
        routePath: req.route?.path,

        aborted: req.aborted,
        statusCodeSent: res.statusCode,

        errorMessage: error.message,
        errorCode: error.code,
        errorName: error.name,
        errorStack: error.stack,

        query: JSON.stringify(req.query),

        notify: true,
      });
    }

    return next(error);
  }

  const { message, code, ...rest } = handleError(error, { req });

  // Don't attempt to send a response for client-aborted requests
  // since headers may have already been sent during streaming
  if (!(error instanceof ClientAbortedRequestError)) {
    res.status(code);
    res.json({ error: message, ...rest });
  }
};
