import type { Application, NextFunction, Request, Response } from 'express';
import { validatePasswordMiddleWare, needsAuthorization } from '#api/auth/index.js';
import { validation } from '#api/utils/index.js';
import { userSchema } from '#shared/types/userSchema.js';
import { tenants } from '#api/tenants/index.js';
import users from '#api/users/users.js';
import { CreateUserController } from './CreateUserController.js';
import { DeleteUserController } from './DeleteUserController.js';
import { GetUsersController } from './GetUsersController.js';
import { UpdateUserController } from './UpdateUserController.js';
import { UnlockAccountController } from './UnlockAccountController.js';
import { UnlockBlockedUserController } from './UnlockBlockedUserController.js';
import { RecoverPasswordController } from './RecoverPasswordController.js';
import { ResetPasswordController } from './ResetPasswordController.js';
import { PUBLIC_USER_ID } from '#api/core/domain/user/User.js';

export const userRoutes = (app: Application) => {
  app.post(
    '/api/users/new',
    needsAuthorization(),
    validatePasswordMiddleWare,
    async (req: Request, res: Response, next: NextFunction) => {
      // for legacy reasons, should be removed one the flag is gone
      if (tenants.current().featureFlags?.v2UsersCreate) {
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
  app.post(
    '/api/users',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    validatePasswordMiddleWare,
    async (req: Request, res: Response, next: NextFunction) => {
      if (tenants.current().featureFlags?.v2UsersUpdate) {
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
    UpdateUserController.createHandler()
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
      if (tenants.current().featureFlags?.v2UsersGet) {
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

  app.post(
    '/api/users/unlock',
    needsAuthorization(),
    validatePasswordMiddleWare,
    async (req: Request, res: Response, next: NextFunction) => {
      if (tenants.current().featureFlags?.v2UsersUtilityRoutes) {
        next();
      } else {
        await validation.validateRequest({
          type: 'object',
          properties: {
            body: {
              type: 'object',
              additionalProperties: false,
              properties: {
                _id: { type: 'string' },
              },
              required: ['_id'],
            },
          },
          required: ['body'],
        })(req, res, next);
      }
    },
    UnlockBlockedUserController.createHandler()
  );

  app.post(
    '/api/unlockaccount',
    async (req: Request, res: Response, next: NextFunction) => {
      if (tenants.current().featureFlags?.v2UsersUtilityRoutes) {
        next();
      } else {
        await validation.validateRequest({
          type: 'object',
          properties: {
            body: {
              type: 'object',
              properties: {
                username: { type: 'string' },
                code: { type: 'string' },
              },
              required: ['username', 'code'],
            },
          },
          required: ['body'],
        })(req, res, next);
      }
    },
    UnlockAccountController.createHandler()
  );

  app.post(
    '/api/recoverpassword',
    async (req: Request, res: Response, next: NextFunction) => {
      if (tenants.current().featureFlags?.v2UsersUtilityRoutes) {
        next();
      } else {
        await validation.validateRequest({
          type: 'object',
          properties: {
            body: {
              type: 'object',
              properties: {
                email: { type: 'string', minLength: 3 },
              },
              required: ['email'],
            },
          },
          required: ['body'],
        })(req, res, next);
      }
    },
    RecoverPasswordController.createHandler()
  );

  app.post(
    '/api/resetpassword',
    async (req: Request, res: Response, next: NextFunction) => {
      if (tenants.current().featureFlags?.v2UsersUtilityRoutes) {
        next();
      } else {
        await validation.validateRequest({
          type: 'object',
          properties: {
            body: {
              type: 'object',
              properties: {
                key: { type: 'string' },
                password: { type: 'string' },
              },
              required: ['key', 'password'],
            },
          },
          required: ['body'],
        })(req, res, next);
      }
    },
    ResetPasswordController.createHandler()
  );
};
