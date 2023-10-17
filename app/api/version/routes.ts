import { config } from 'api/config';
import { Application } from 'express';

export const versionRoutes = (app: Application) => {
  app.get('/api/version', (_req, res) => {
    res.json({ version: config.VERSION });
  });
};
