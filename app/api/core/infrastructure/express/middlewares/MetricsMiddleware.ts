import type { NextFunction, Request, Response } from 'express';
import { performance } from 'perf_hooks';
import {
  httpRequestTotal,
  httpRequestDuration,
} from '#api/core/libs/logger/PrometheusCollector.js';
import { config } from '#api/config.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { getRouteInfo } from '#api/core/infrastructure/express/RouteLabel.js';

const metricsMiddleware = (request: Request, response: Response, next: NextFunction) => {
  const { enabled, sampleRate = 1 } = tenants.current().featureFlags?.prometheus || {};

  if (!enabled || sampleRate <= 0) {
    next();
    return;
  }

  if (sampleRate < 1 && Math.random() >= sampleRate) {
    next();
    return;
  }

  response.on('finish', () => {
    const routeInfo = getRouteInfo(request, response);
    if (!routeInfo) return;

    const durationSeconds = (performance.now() - (request.startPerfMs ?? performance.now())) / 1000;

    const labels = {
      method: request.method,
      route: routeInfo.label,
      route_kind: routeInfo.kind,
      env: config.ENVIRONMENT,
    };

    httpRequestTotal.inc(
      {
        ...labels,
        status_code: String(response.statusCode),
      },
      1 / sampleRate
    );

    httpRequestDuration.observe(labels, durationSeconds);
  });

  next();
};

export { metricsMiddleware };
