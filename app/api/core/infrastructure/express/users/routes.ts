import type { Application, NextFunction, Request, Response } from 'express';
import { validatePasswordMiddleWare, needsAuthorization } from '#api/auth/index.js';
import { validation } from '#api/utils/index.js';
import { userSchema } from '#shared/types/userSchema.js';
import { tenants } from '#api/tenants/index.js';
import users from '#api/users/users.js';
import { CreateUserController } from './CreateUserController.js';
import { DeleteUserController } from './DeleteUserController.js';
import { GetUsersController } from './GetUsersController.js';
import { PUBLIC_USER_ID } from '#api/core/domain/user/User.js';

export const userRoutes = (app: Application) => {
  app.post(
    '/api/users/new',
    needsAuthorization(),
    validatePasswordMiddleWare,
    async (req: Request, res: Response, next: NextFunction) => {
      // for legacy reasons, should be removed one the flag is gone
      if (tenants.current().featureFlags?.v2CreateUser) {
        next();
      } else {
        await validation.validateRequest({
          type: 'object',
          properties: {
            body: userSchema,
          },
          required: ['body'],
        })(req, res, next);
      }
    },
    CreateUserController.createHandler()
  );
  app.delete(
    '/api/users',
    needsAuthorization(),
    validatePasswordMiddleWare,
    DeleteUserController.createHandler()
  );
  app.get(
    '/api/users',
    needsAuthorization(),
    async (_req: Request, res: Response, next: NextFunction) => {
      if (tenants.current().featureFlags?.v2GetUsers) {
        next();
      } else {
        users
          .get({}, '+groups +failedLogins +accountLocked')
          .then(response => {
            const filteredUsers = response.filter(
              user => user._id.toString() !== PUBLIC_USER_ID.toString()
            );
            res.json(filteredUsers);
          })
          .catch(next);
      }
    },
    GetUsersController.createHandler()
  );
};
