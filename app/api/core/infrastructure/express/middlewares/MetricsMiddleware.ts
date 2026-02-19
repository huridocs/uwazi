import { config } from 'api/config';
import { httpRequestCounter, httpRequestDuration } from 'api/core/libs/logger/PrometheusCollector';
import { NextFunction, Request, Response } from 'express';

type RouteType = string | object | undefined;

const EXCLUDED_ROUTES = ['/api/version', '/metrics'];

const shouldSample = (route: RouteType): route is string => {
  if (typeof route !== 'string') return false;

  if (EXCLUDED_ROUTES.includes(route)) return false;

  // Sampling 10% of the requests for performance reasons.
  return Math.random() <= 0.1;
};

const metricsMiddleware = (request: Request, response: Response, next: NextFunction) => {
  const startTimeMs = Date.now();

  response.on('finish', () => {
    const endTimeMs = Date.now();
    const durationSeconds = (endTimeMs - startTimeMs) / 1000;

    const route = request.route?.path as RouteType;

    if (!shouldSample(route)) return;

    const labels = {
      method: request.method,
      route,
      env: config.ENVIRONMENT,
    };

    httpRequestCounter.inc({
      ...labels,
      status_code: String(response.statusCode),
    });

    httpRequestDuration.observe(labels, durationSeconds);
  });

  next();
};

export { metricsMiddleware };
