import { Application } from 'express';
import needsAuthorization from 'api/auth/authMiddleware';
import { RetrieveStats } from 'api/stats/application/RetrieveStats';
import { tenants } from 'api/tenants';
import { DB } from 'api/odm';

export default (app: Application) => {
  app.get('/api/stats', needsAuthorization(['admin']), async (req, res, next) => {
    const action = new RetrieveStats(DB.connectionForDB(tenants.current().dbName));

    const stats = await action.execute();

    res.json(stats);
  });
};
