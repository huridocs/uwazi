import { Application } from 'express';
import { entitiesPermissions } from 'api/permissions/entitiesPermissions';
import { contributors } from 'api/permissions/contributors';
import { validation } from 'api/utils';

export const permissionRoutes = (app: Application) => {
  app.post('/api/entities/permissions', async (req, res, _next) => {
    await entitiesPermissions.setEntitiesPermissions(req.body);
    res.json(req.body);
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
