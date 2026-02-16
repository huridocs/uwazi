import { httpRequestCounter, httpRequestDuration } from 'api/core/libs/logger/PrometheusCollector';
import { NextFunction, Request, Response } from 'express';

type RouteType = string | object | undefined;

const EXCLUDED_ROUTES = ['/api/version', '/metrics'];

const shouldSample = (route: RouteType): route is string => {
  if (typeof route !== 'string') return false;

  if (EXCLUDED_ROUTES.includes(route)) return false;

  return true;
};

const metricsMiddleware = (request: Request, response: Response, next: NextFunction) => {
  const startTimeMs = Date.now();

  response.on('finish', () => {
    const endTimeMs = Date.now();
    const durationSeconds = (endTimeMs - startTimeMs) / 1000;

    const route = request.route?.path as RouteType;

    if (!shouldSample(route)) return;

    httpRequestCounter.inc({
      method: request.method,
      status_code: String(response.statusCode),
      route,
    });

    httpRequestDuration.observe({ method: request.method, route }, durationSeconds);
  });

  next();
};

export { metricsMiddleware };
