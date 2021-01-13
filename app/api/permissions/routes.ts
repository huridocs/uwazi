import { Application } from 'express';
import { needsAuthorization } from 'api/auth';
import { validation } from 'api/utils';
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
    async (req, res, next) => {
      try {
        await entitiesPermissions.setEntitiesPermissions(req.body);
        res.json(req.body);
      } catch (err) {
        next(err);
      }
    }
  );

  app.get('/api/entities/permissions', async (req, res, next) => {
    const sharedIds = JSON.parse(req.query.ids);
    try {
      const permissions = await entitiesPermissions.getEntitiesPermissions(sharedIds);
      res.json(permissions);
    } catch (err) {
      next(err);
    }
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
    async (req, res, next) => {
      try {
        const availableCollaborators = await collaborators.getCollaborators(req.query.filterTerm);
        res.json(availableCollaborators);
      } catch (err) {
        next(err);
      }
    }
  );
};
