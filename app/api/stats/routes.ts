import { Application } from 'express';
import needsAuthorization from 'api/auth/authMiddleware';
import { RetrieveStatsService } from 'api/stats/services/RetrieveStatsService';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';

export default (app: Application) => {
  app.get('/api/stats', needsAuthorization(['admin']), async (_req, res, _next) => {
    const action = new RetrieveStatsService(getConnection());
    const stats = await action.execute();

    res.json(stats);
  });
};
