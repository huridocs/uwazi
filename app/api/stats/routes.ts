import { Application } from 'express';
import needsAuthorization from 'api/auth/authMiddleware';
import { RetrieveStatsService } from 'api/stats/services/RetrieveStatsService';
import { tenants } from 'api/tenants';
import { DB } from 'api/odm';

export default (app: Application) => {
  app.get('/api/stats', needsAuthorization(['admin']), async (_req, res, _next) => {
    const { db } = DB.connectionForDB(tenants.current().dbName);
    const action = new RetrieveStatsService(db);
    const stats = await action.execute();

    res.json(stats);
  });
};
