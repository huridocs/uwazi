import { Application } from 'express';
import { entitiesPermissions } from 'api/permissions/entitiesPermissions';
import { contributors } from 'api/permissions/contributors';
import { validation } from 'api/utils';

export const permissionRoutes = (app: Application) => {
  app.post('/api/entities/permissions', async (req, res, _next) => {
    await entitiesPermissions.setEntitiesPermissions(req.body, req.language);
    res.json(req.body);
  });

  app.get('/api/entities/permissions', async (req, res, _next) => {
    const permissions = await entitiesPermissions.getEntitiesPermissions(req.query);
    res.json(permissions);
  });

  app.get(
    '/api/contributors',
    validation.validateRequest({
      properties: {
        query: {
          required: ['filterTerm'],
          properties: {
            filterTerm: { type: 'string' },
          },
        },
      },
    }),
    async (req, res, _next) => {
      const availableContributors = await contributors.getContributors(req.query.filterTerm);
      res.json(availableContributors);
    }
  );
};
