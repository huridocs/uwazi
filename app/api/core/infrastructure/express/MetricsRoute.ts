import { Application } from 'express';
import { config } from '#api/config.js';
import {
  apiVersionInfo,
  collectNodeProcessMetrics,
  registry,
} from '#api/core/libs/logger/PrometheusCollector.js';

export const registerMetricsRoutes = (app: Application) => {
  collectNodeProcessMetrics();
  apiVersionInfo.labels(config.VERSION).set(1);

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', registry.contentType);
    res.send(await registry.metrics());
  });
};
