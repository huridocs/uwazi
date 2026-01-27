import { handleError } from './handleError';
import { appContext } from './AppContext';

export default (error, req, res, next) => {
  const { message, code, ...rest } = handleError(error, { req });

  // Capture error in observability log
  const logBuilder = appContext.get('logBuilder');
  if (logBuilder) {
    logBuilder.error(error);
    logBuilder.add({ error_code: code });
  }

  res.status(code);
  res.json({ error: message, ...rest });

  next();
};
