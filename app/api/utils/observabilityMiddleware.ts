import { Request, Response, NextFunction } from 'express';
import { appContext } from 'api/utils/AppContext';
import { TelemetryCollector } from 'api/core/libs/logger/TelemetryCollector';
import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';

const observabilityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const telemetryCollector = new TelemetryCollector('request');
  const logger = LoggerFactory.default();

  telemetryCollector.add({
    request_id: crypto.randomUUID(),
    method: req.method,
    path: req.path,
  });

  res.on('finish', () => {
    telemetryCollector.add({
      status_code: res.statusCode,
      user_id: req?.user?._id?.toString(),
    });

    const logData = telemetryCollector.build();

    logger.info('HTTP Request', logData);
  });

  appContext.setTelemetryCollector(telemetryCollector);

  return next();
};

export { observabilityMiddleware };
