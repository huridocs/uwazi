import { Application } from 'express';
import { needsAuthorization } from 'api/auth';
import { parseQuery, validation } from 'api/utils';
import { entitiesPermissions } from 'api/permissions/entitiesPermissions';
import { collaborators } from 'api/permissions/collaborators';
import { permissionsDataSchema, validateUniquePermissions } from 'shared/types/permissionSchema';

export const permissionRoutes = (app: Application) => {
  app.post(
    '/api/entities/permissions',
    needsAuthorization(['admin', 'editor']),
    validation.validateRequest({
      properties: {
        body: {
          ...permissionsDataSchema,
        },
      },
    }),
    async (req, res, next) => {
      try {
        await validateUniquePermissions(req.body);
        await entitiesPermissions.set(req.body);
        res.json(req.body);
      } catch (err) {
        next(err);
      }
    }
  );

  app.get('/api/entities/permissions', parseQuery, async (req, res, next) => {
    try {
      const permissions = await entitiesPermissions.get(req.query.ids);
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
        const availableCollaborators = await collaborators.search(req.query.filterTerm);
        res.json(availableCollaborators);
      } catch (err) {
        next(err);
      }
    }
  );
};
