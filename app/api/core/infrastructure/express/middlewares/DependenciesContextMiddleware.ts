import { tenants } from 'api/tenants';
import { NextFunction, Request, Response } from 'express';
import { EventEmitterFactory } from 'api/core/libs/eventEmitter/EventEmitterFactory';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { DependenciesContext } from 'api/core/libs/DependenciesContext';
import { TelemetryCollector } from 'api/core/libs/logger/TelemetryCollector';
import { TransactionManagerFactory } from '../../factories/TransactionManagerFactory';
import { IdGeneratorFactory } from '../../factories/IdGeneratorFactory';
import { LoggerFactory } from '../../factories/LoggerFactory';

const dependenciesContextMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  if (!/^\/api(\/|$)/.test(request.path)) {
    return next();
  }

  const telemetryCollector = new TelemetryCollector('request');

  const tenant = tenants.current();
  const transactionManager = TransactionManagerFactory.default();
  const jobsDispatcher = DefaultDispatcher(tenant.name, transactionManager);

  const eventEmitter = EventEmitterFactory.default();
  const idGenerator = IdGeneratorFactory.default();
  const logger = LoggerFactory.default();

  response.on('finish', () => {
    telemetryCollector.add({
      method: request.method,
      path: request.path,
      status_code: response.statusCode,
      user_id: request?.user?._id?.toString(),
    });

    logger.info('HTTP Request', telemetryCollector.build());
  });

  return DependenciesContext.run(
    {
      transactionManager,
      eventEmitter,
      idGenerator,
      jobsDispatcher,
      logger,
      telemetryCollector,
    },
    next
  );
};

export { dependenciesContextMiddleware };
