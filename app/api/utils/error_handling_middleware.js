import * as Sentry from '@sentry/node';
import { config } from 'api/config';
import { handleError } from './handleError';

export default (error, req, res, next) => {
  const { message, code, ...rest } = handleError(error, { req });

  if (config.sentry.dsn && code >= 500) {
    Sentry.captureException(error);
  }

  res.status(code);
  res.json({ error: message, ...rest });

  next();
};
