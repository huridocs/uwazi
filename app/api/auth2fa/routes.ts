import type { Application } from 'express';
import needsAuthorization from '#api/auth/authMiddleware.js';
import { GenerateTwoFactorSecretController } from '#api/core/infrastructure/express/users/GenerateTwoFactorSecretController.js';
import { EnableTwoFactorAuthController } from '#api/core/infrastructure/express/users/EnableTwoFactorAuthController.js';
import { ResetTwoFactorAuthController } from '#api/core/infrastructure/express/users/ResetTwoFactorAuthController.js';
import { validatePasswordMiddleWare } from '#api/core/infrastructure/express/users/ValidatePasswordMiddleWare.js';

export default (app: Application) => {
  app.post(
    '/api/auth2fa-secret',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    GenerateTwoFactorSecretController.createHandler()
  );

  app.post(
    '/api/auth2fa-enable',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    EnableTwoFactorAuthController.createHandler()
  );

  app.post(
    '/api/auth2fa-reset',
    needsAuthorization(['admin']),
    validatePasswordMiddleWare,
    ResetTwoFactorAuthController.createHandler()
  );
};
