import type { Application } from 'express';
import needsAuthorization from '#api/auth/authMiddleware.js';
import { RetrieveStatsService } from '#api/stats/services/RetrieveStatsService.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';

export default (app: Application) => {
  app.get('/api/stats', needsAuthorization(['admin']), async (_req, res, _next) => {
    const action = new RetrieveStatsService(getConnection());
    const stats = await action.execute();

    res.json(stats);
  });
};
