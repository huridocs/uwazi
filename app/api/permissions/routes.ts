import { Application } from 'express';
import { needsAuthorization } from 'api/auth';
import { parseQuery, validation } from 'api/utils';
import { entitiesPermissions } from 'api/permissions/entitiesPermissions';
import { permissionSchema } from 'shared/types/permissionSchema';
import { collaborators } from 'api/permissions/collaborators';

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
      await entitiesPermissions.set(req.body);
      res.json(req.body);
    }
  );

  app.get('/api/entities/permissions', parseQuery, async (req, res, _next) => {
    const permissions = await entitiesPermissions.get(req.query.ids);
    res.json(permissions);
  });

  app.get(
    '/api/collaborators',
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
      const availableCollaborators = await collaborators.search(req.query.filterTerm);
      res.json(availableCollaborators);
    }
  );
};
