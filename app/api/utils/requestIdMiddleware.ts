import { Request, Response, NextFunction } from 'express';
import { appContext } from 'api/utils/AppContext';
import { LogBuilder } from 'api/core/libs/logger/infrastructure/LogBuilder';

const requestIdMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const logBuilder = new LogBuilder();
  const requestId = Math.floor(Math.random() * 10000);
  const timestamp = new Date().toISOString();

  logBuilder.time('request_duration');
  logBuilder.add({
    request_id: requestId,
    timestamp,
    method: req.method,
    path: req.path,
    tenant: req.get('tenant') || 'default',
    has_user: !!req.user,
  });

  appContext.set('logBuilder', logBuilder);
  appContext.set('requestId', requestId);

  next();
};

export { requestIdMiddleware };
