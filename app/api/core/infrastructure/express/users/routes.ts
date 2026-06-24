import type { Application, NextFunction, Request, Response } from 'express';
import { validatePasswordMiddleWare, needsAuthorization } from '#api/auth/index.js';
import { CreateUserController } from './CreateUserController.js';
import { validation } from '#api/utils/index.js';
import { userSchema } from '#shared/types/userSchema.js';
import { tenants } from '#api/tenants/index.js';

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
};
