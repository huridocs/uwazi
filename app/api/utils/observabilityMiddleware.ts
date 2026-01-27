import { Request, Response, NextFunction } from 'express';
import { appContext } from 'api/utils/AppContext';
import { LogBuilder } from 'api/core/libs/logger/infrastructure/LogBuilder';
import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';

const observabilityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const logBuilder = new LogBuilder();
  const logger = LoggerFactory.default();

  logBuilder.timeStart('request');

  logBuilder.add({
    method: req.method,
    path: req.path,
  });

  res.on('finish', () => {
    logBuilder.timeEnd('request');

    logBuilder.add({
      status_code: res.statusCode,
    });

    const logData = logBuilder.build();

    logger.info('HTTP Request', logData);
  });

  appContext.set('logBuilder', logBuilder);

  return next();
};

export { observabilityMiddleware };
