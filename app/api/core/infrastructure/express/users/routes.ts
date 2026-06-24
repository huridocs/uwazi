import type { Application } from 'express';
import { validatePasswordMiddleWare, needsAuthorization } from '#api/auth/index.js';
import { CreateUserController } from './CreateUserController.js';
import { validation } from '#api/utils/index.js';
import { userSchema } from '#shared/types/userSchema.js';

export const userRoutes = (app: Application) => {
  app.post(
    '/api/users/new',
    needsAuthorization(),
    validatePasswordMiddleWare,
    // for legacy reasons, should be removed
    validation.validateRequest({
      type: 'object',
      properties: {
        body: userSchema,
      },
      required: ['body'],
    }),
    CreateUserController.createHandler()
  );
};
