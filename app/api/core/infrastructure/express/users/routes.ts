import type { Application, NextFunction, Request, Response } from 'express';
import { validatePasswordMiddleWare, needsAuthorization } from '#api/auth/index.js';
import { validation } from '#api/utils/index.js';
import { userSchema } from '#shared/types/userSchema.js';
import { tenants } from '#api/tenants/index.js';
import { CreateUserController } from './CreateUserController.js';
import { DeleteUserController } from './DeleteUserController.js';

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
    async (req: Request, res: Response, next: NextFunction) => {
      // for legacy reasons, should be removed one the flag is gone
      if (tenants.current().featureFlags?.v2DeleteUser) {
        next();
      } else {
        //check if parseQuery is needed
        await validation.validateRequest({
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
          required: ['query'],
        })(req, res, next);
      }
    },

    DeleteUserController.createHandler()
  );
};
