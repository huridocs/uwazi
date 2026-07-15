import type { Application } from 'express';
import needsAuthorization from '#api/auth/authMiddleware.js';
import { RetrieveStatsService } from '#api/stats/services/RetrieveStatsService.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { FilesDAOFactory } from '#api/core/infrastructure/factories/FilesDAOFactory.js';
import { MongoEntitiesDAOFactory } from '#api/core/infrastructure/factories/MongoEntitiesDAOFactory.js';
import { User } from '#api/users.v2/model/User.js';

export default (app: Application) => {
  app.get('/api/stats', needsAuthorization(['admin']), async (req, res, _next) => {
    const action = new RetrieveStatsService(
      getConnection(),
      FilesDAOFactory.default(),
      MongoEntitiesDAOFactory.default({ user: User.createFrom(req.user) })
    );
    const stats = await action.execute(req.language);

    res.json(stats);
  });
};
