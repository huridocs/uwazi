import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
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
import { getRouteInfo } from '#api/core/infrastructure/express/RouteLabel.js';

const dependenciesContextMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const tenant = tenants.current();
  const actor = User.createFrom(request.user);
  const correlationId = randomUUID();

  response.on('finish', () => {
    if (!ExecutionContext.isTelemetryEnabled) return;

    const routeInfo = getRouteInfo(request, response);
    if (!routeInfo) return;

    ExecutionContext.telemetryCollector.add({
      method: request.method,
      path: routeInfo.label,
      route_kind: routeInfo.kind,
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
      correlationId,
      factories: {
        transactionManager: TransactionManagerFactory.default,
        postgresTransactionManager: PostgresTransactionManagerFactory.default,
        jobsDispatcher: () => DefaultDispatcher(tenant.name, ExecutionContext.transactionManager),
        eventEmitter: EventEmitterFactory.default,
        idGenerator: IdGeneratorFactory.default,
        logger: LoggerFactory.default,
        telemetryCollector: () => new TelemetryCollector('http_request', request.startPerfMs),
      },
    },
    next
  );
};

export { dependenciesContextMiddleware };
