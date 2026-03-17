import { handleError } from './handleError.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { ClientAbortedRequestError } from '#api/common.v2/errors/ClientAbortedRequestError.js';

// eslint-disable-next-line import/no-default-export, consistent-return
export default (error, req, res, next) => {
  // ClientAbortedRequestError: connection already closed by client, nothing to do
  if (error instanceof ClientAbortedRequestError && req.aborted) {
    return;
  }

  if (res.headersSent) {
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

    return next(error);
  }

  const { message, code, ...rest } = handleError(error, { req });
  res.status(code);
  res.json({ error: message, ...rest });
};
