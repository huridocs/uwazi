import { Application } from 'express';
import { entitiesPermissions } from 'api/permissions/entitiesPermissions';

export const permissionRoutes = (app: Application) => {
  app.post('/api/entities/permissions', async (req, res, _next) => {
    await entitiesPermissions.setEntitiesPermissions(req.body);
    res.json(req.body);
  });
};
