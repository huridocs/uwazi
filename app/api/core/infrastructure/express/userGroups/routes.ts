import type { Application, Request, Response } from 'express';
import { needsAuthorization } from '#api/auth/index.js';
import { CreateUserGroupController } from './CreateUserGroupController.js';
import { UpdateUserGroupController } from './UpdateUserGroupController.js';
import { DeleteUserGroupsController } from './DeleteUserGroupsController.js';
import { GetUserGroupsController } from './GetUserGroupsController.js';

const userGroupsRoutes = (app: Application) => {
  app.post(
    '/api/usergroups',
    needsAuthorization(['admin']),
    async (req: Request, res: Response) => {
      if (req.body?._id) {
        return UpdateUserGroupController.createHandler()(req, res);
      }

      return CreateUserGroupController.createHandler()(req, res);
    }
  );

  app.get(
    '/api/usergroups',
    needsAuthorization(['admin']),
    GetUserGroupsController.createHandler()
  );

  app.delete(
    '/api/usergroups',
    needsAuthorization(['admin']),
    DeleteUserGroupsController.createHandler()
  );
};

export { userGroupsRoutes };
