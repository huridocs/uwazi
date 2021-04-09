import { Application } from 'express';
import { needsAuthorization } from 'api/auth';
import { validation } from 'api/utils';
import { entitiesPermissions } from 'api/permissions/entitiesPermissions';
import { collaborators } from 'api/permissions/collaborators';
import { permissionsDataSchema } from 'shared/types/permissionSchema';

export const permissionRoutes = (app: Application) => {
  app.post(
    '/api/entities/permissions',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    validation.validateRequest({
      properties: {
        body: {
          ...permissionsDataSchema,
        },
      },
    }),
    async (req, res, next) => {
      try {
        await entitiesPermissions.set(req.body);
        res.json(req.body);
      } catch (err) {
        next(err);
      }
    }
  );

  app.put(
    '/api/entities/permissions/',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    async (req, res, next) => {
      try {
        const permissions = await entitiesPermissions.get(req.body);
        res.json(permissions);
      } catch (err) {
        next(err);
      }
    }
  );

  app.get(
    '/api/collaborators',
    needsAuthorization(['admin', 'editor', 'collaborator']),
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
