import type { Application, NextFunction, Request, Response } from 'express';
import { needsAuthorization } from '#api/auth/index.js';
import { parseQuery, validation } from '#api/utils/index.js';
import { tenants } from '#api/tenants/index.js';
import legacyUserGroups from '#api/usergroups/userGroups.js';
import { CreateUserGroupController } from './CreateUserGroupController.js';
import { UpdateUserGroupController } from './UpdateUserGroupController.js';
import { DeleteUserGroupsController } from './DeleteUserGroupsController.js';
import { GetUserGroupsController } from './GetUserGroupsController.js';

const runMiddleware = (
  middleware: (req: Request, res: Response, next: NextFunction) => void,
  req: Request,
  res: Response
) =>
  new Promise<void>((resolve, reject) => {
    middleware(req, res, error => (error ? reject(error) : resolve()));
  });

const deleteQuerySchema = {
  type: 'object',
  properties: {
    query: {
      type: 'object',
      additionalProperties: false,
      required: ['ids'],
      properties: {
        ids: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
      },
    },
  },
};

const userGroupsRoutes = (app: Application) => {
  app.post(
    '/api/usergroups',
    needsAuthorization(['admin']),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!tenants.current().featureFlags?.v2Usergroups) {
          const group = await legacyUserGroups.save(req.body);
          res.json(group);
          return;
        }

        if (req.body?._id) {
          await UpdateUserGroupController.createHandler()(req, res);
        } else {
          await CreateUserGroupController.createHandler()(req, res);
        }
      } catch (error) {
        next(error);
      }
    }
  );

  app.get(
    '/api/usergroups',
    needsAuthorization(['admin']),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!tenants.current().featureFlags?.v2Usergroups) {
          const groups = await legacyUserGroups.get({});
          res.json(groups);
          return;
        }

        await GetUserGroupsController.createHandler()(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  app.delete(
    '/api/usergroups',
    needsAuthorization(['admin']),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!tenants.current().featureFlags?.v2Usergroups) {
          await runMiddleware(parseQuery, req, res);
          await runMiddleware(validation.validateRequest(deleteQuerySchema), req, res);

          const { ids } = req.query;
          const idsArray = Array.isArray(ids) ? ids : [ids];
          const deletedGroup = await legacyUserGroups.delete({ _id: { $in: idsArray } });
          res.json(deletedGroup);
          return;
        }

        await DeleteUserGroupsController.createHandler()(req, res);
      } catch (error) {
        next(error);
      }
    }
  );
};

export { userGroupsRoutes };
