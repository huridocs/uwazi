import { Application } from 'express';
import { collectNodeProcessMetrics, registry } from 'api/core/libs/logger/PrometheusCollector';

export const registerMetricsRoutes = (app: Application) => {
  collectNodeProcessMetrics();

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', registry.contentType);
    res.send(await registry.metrics());
  });
};
