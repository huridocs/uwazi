import { Application } from 'express';
import needsAuthorization from '../auth/authMiddleware.js';
import { RetrieveStatsService } from '../stats/services/RetrieveStatsService.js';
import { getConnection } from '#api/common.v2/database/getConnectionForCurrentTenant.js';

export default (app: Application) => {
  app.get('/api/stats', needsAuthorization(['admin']), async (_req, res, _next) => {
    const action = new RetrieveStatsService(getConnection());
    const stats = await action.execute();

    res.json(stats);
  });
};
