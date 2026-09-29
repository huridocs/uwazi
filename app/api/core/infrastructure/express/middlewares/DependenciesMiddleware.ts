import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { tenants } from '#api/tenants/index.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { User } from '#api/users.v2/model/User.js';
import { ExecutionContextFactory } from '../../factories/ExecutionContextFactory.js';
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
    ExecutionContextFactory.build({
      tenant,
      actor,
      correlationId,
      telemetry: { kind: 'http_request', startPerfMs: request.startPerfMs },
    }),
    next
  );
};

export { dependenciesContextMiddleware };
