import { Application } from 'express';
import { needsAuthorization } from 'api/auth';
import { validation } from 'api/utils';
import { entitiesPermissions } from 'api/permissions/entitiesPermissions';
import { contributors } from 'api/permissions/contributors';
import { permissionSchema } from 'shared/types/permissionSchema';

export const permissionRoutes = (app: Application) => {
  app.post(
    '/api/entities/permissions',
    needsAuthorization(['admin', 'editor']),
    validation.validateRequest({
      properties: {
        body: {
          required: ['ids', 'permissions'],
          properties: {
            ids: { type: 'array', items: { type: 'string' } },
            permissions: {
              type: 'array',
              items: permissionSchema,
            },
          },
        },
      },
    }),
    async (req, res, _next) => {
      await entitiesPermissions.setEntitiesPermissions(req.body);
      res.json(req.body);
    }
  );

  app.get('/api/entities/permissions', async (req, res, _next) => {
    const sharedIds = JSON.parse(req.query.id);
    const permissions = await entitiesPermissions.getEntitiesPermissions(sharedIds);
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
