import { Request, Response, NextFunction } from 'express';
import { appContext } from 'api/utils/AppContext';
import { LogBuilder } from 'api/core/libs/logger/infrastructure/LogBuilder';

/**
 * Middleware to capture response details and output observability logs
 * Should be placed early in the middleware chain so res.on('finish') fires after other middlewares
 */
const observabilityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const logBuilder = appContext.get('logBuilder') as LogBuilder;

  if (!logBuilder) {
    return next();
  }

  // Capture request metadata
  logBuilder.add({
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    user_id: req.user?.username || 'anonymous',
  });

  // Capture response when it finishes
  res.on('finish', () => {
    logBuilder.timeEnd('request_duration');
    logBuilder.add({
      status_code: res.statusCode,
      content_length: res.get('content-length') || 0,
    });

    const logData = logBuilder.build();

    // Output to console for now (could be Winston, Pino, etc.)
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(logData));
  });

  return next();
};

export { observabilityMiddleware };
