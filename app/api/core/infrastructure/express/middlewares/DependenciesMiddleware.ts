import { NextFunction, Request, Response } from 'express';
import { tenants } from '#api/tenants/index.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TransactionManagerFactory } from '../../factories/TransactionManagerFactory.js';
import { PostgresTransactionManagerFactory } from '../../factories/PostgresTransactionManagerFactory.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { IdGeneratorFactory } from '../../factories/IdGeneratorFactory.js';
import { LoggerFactory } from '../../factories/LoggerFactory.js';
import { User } from '#api/users.v2/model/User.js';
import { TelemetryCollector } from '#api/core/libs/logger/TelemetryCollector.js';

const dependenciesContextMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const tenant = tenants.current();
  const actor = User.createFrom(request.user);

  response.on('finish', () => {
    ExecutionContext.telemetryCollector.add({
      method: request.method,
      path: request.path,
      status_code: response.statusCode,
    });

    ExecutionContext.logger.info(
      'HTTP Request Telemetry',
      ExecutionContext.telemetryCollector.build()
    );
  });

  return ExecutionContext.run(
    {
      tenant,
      actor,
      factories: {
        transactionManager: TransactionManagerFactory.default,
        postgresTransactionManager: PostgresTransactionManagerFactory.default,
        jobsDispatcher: () => DefaultDispatcher(tenant.name, ExecutionContext.transactionManager),
        eventEmitter: EventEmitterFactory.default,
        idGenerator: IdGeneratorFactory.default,
        logger: LoggerFactory.default,
        telemetryCollector: () => new TelemetryCollector('http_request'),
      },
    },
    next
  );
};

export { dependenciesContextMiddleware };
