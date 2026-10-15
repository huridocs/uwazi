import type { Application } from 'express';
import needsAuthorization from '#api/auth/authMiddleware.js';
import { RetrieveStatsService } from '#api/stats/services/RetrieveStatsService.js';
import { FilesDAOFactory } from '#api/core/infrastructure/factories/FilesDAOFactory.js';
import { EntitiesDAOFactory } from '#api/core/infrastructure/factories/EntitiesDAOFactory.js';
import { UsersQueryServiceFactory } from '#api/core/infrastructure/factories/UsersQueryServiceFactory.js';

export default (app: Application) => {
  app.get('/api/stats', needsAuthorization(['admin']), async (req, res, _next) => {
    const action = new RetrieveStatsService(
      FilesDAOFactory.default(),
      EntitiesDAOFactory.default(),
      UsersQueryServiceFactory.default()
    );
    const stats = await action.execute(req.language);

    res.json(stats);
  });
};
