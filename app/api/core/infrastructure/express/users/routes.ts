import type { Application } from 'express';
import { needsAuthorization } from '#api/auth/index.js';
import { CreateUserController } from './CreateUserController.js';
import { DeleteUserController } from './DeleteUserController.js';
import { GetUsersController } from './GetUsersController.js';
import { UpdateUserController } from './UpdateUserController.js';
import { UnlockAccountController } from './UnlockAccountController.js';
import { UnlockBlockedUserController } from './UnlockBlockedUserController.js';
import { RecoverPasswordController } from './RecoverPasswordController.js';
import { ResetPasswordController } from './ResetPasswordController.js';
import { validatePasswordMiddleWare } from './ValidatePasswordMiddleWare.js';

export const userRoutes = (app: Application) => {
  app.post(
    '/api/users/new',
    needsAuthorization(),
    validatePasswordMiddleWare,
    CreateUserController.createHandler()
  );
  app.post(
    '/api/users',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    validatePasswordMiddleWare,
    UpdateUserController.createHandler()
  );
  app.delete(
    '/api/users',
    needsAuthorization(),
    validatePasswordMiddleWare,
    DeleteUserController.createHandler()
  );
  app.get('/api/users', needsAuthorization(), GetUsersController.createHandler());

  app.post(
    '/api/users/unlock',
    needsAuthorization(),
    validatePasswordMiddleWare,
    UnlockBlockedUserController.createHandler()
  );

  app.post('/api/unlockaccount', UnlockAccountController.createHandler());

  app.post('/api/recoverpassword', RecoverPasswordController.createHandler());

  app.post('/api/resetpassword', ResetPasswordController.createHandler());
};
