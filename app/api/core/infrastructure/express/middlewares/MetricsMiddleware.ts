import { NextFunction, Request, Response } from 'express';
import {
  httpRequestTotal,
  httpRequestDuration,
} from '#api/core/libs/logger/PrometheusCollector.js';
import { config } from '#api/config.js';
import { tenants } from '#api/tenants/tenantContext.js';

const EXCLUDED_ROUTES = ['/api/version', '/metrics'];

const NOT_FOUND_LABEL = 'not_found';
const STATIC_ASSET_LABEL = 'static_asset';

const STATIC_ASSET_RE = /\.[a-z0-9]+$/i;

const getSSRRouteLabel = (path: string): string => {
  const [, firstSegment, secondSegment] = path.match(/^\/([^/]*)\/?([^/]*)/i) || [];

  const section = /^[a-z]{2}$/i.test(firstSegment) ? secondSegment : firstSegment;

  return section ? section.toLowerCase() : 'home';
};

const isStaticAssetPath = (path: string) =>
  path.startsWith('/public/') || path.startsWith('/flag-images/') || STATIC_ASSET_RE.test(path);

const getRouteLabel = (request: Request, response: Response): string | undefined => {
  const routePath = request.route?.path;

  if (typeof routePath === 'string') {
    return EXCLUDED_ROUTES.includes(routePath) ? undefined : routePath;
  }

  if (response.statusCode === 404) return NOT_FOUND_LABEL;

  if (isStaticAssetPath(request.path)) return STATIC_ASSET_LABEL;

  // Non-string, truthy route path means Express matched a regex route (the SSR catch-all).
  if (routePath) return `ssr:${getSSRRouteLabel(request.path)}`;

  return undefined;
};

const metricsMiddleware = (request: Request, response: Response, next: NextFunction) => {
  const { enabled, sampleRate = 1 } = tenants.current().metricsConfig || {};

  if (!enabled || sampleRate <= 0) {
    next();
    return;
  }

  if (sampleRate < 1 && Math.random() >= sampleRate) {
    next();
    return;
  }

  const startTimeMs = Date.now();

  response.on('finish', () => {
    const route = getRouteLabel(request, response);
    if (!route) return;

    const endTimeMs = Date.now();
    const durationSeconds = (endTimeMs - startTimeMs) / 1000;

    const labels = {
      method: request.method,
      route,
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
