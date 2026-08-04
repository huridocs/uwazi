import type { Application, NextFunction, Request, Response } from 'express';
import needsAuthorization from '#api/auth/authMiddleware.js';
import { validation } from '#api/utils/index.js';
import { ObjectIdAsString } from '#api/utils/ajvSchemas.js';
import { validatePasswordMiddleWare } from '#api/auth/index.js';
import { tenants } from '#api/tenants/index.js';
import { GenerateTwoFactorSecretController } from '#api/core/infrastructure/express/users/GenerateTwoFactorSecretController.js';
import { EnableTwoFactorAuthController } from '#api/core/infrastructure/express/users/EnableTwoFactorAuthController.js';
import { ResetTwoFactorAuthController } from '#api/core/infrastructure/express/users/ResetTwoFactorAuthController.js';

export default (app: Application) => {
  app.post(
    '/api/auth2fa-secret',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    async (req: Request, res: Response, next: NextFunction) => {
      if (tenants.current().featureFlags?.v2Auth2fa) {
        next();
      } else {
        await validation.validateRequest({
          type: 'object',
        })(req, res, next);
      }
    },
    GenerateTwoFactorSecretController.createHandler()
  );

  app.post(
    '/api/auth2fa-enable',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    async (req: Request, res: Response, next: NextFunction) => {
      if (tenants.current().featureFlags?.v2Auth2fa) {
        next();
      } else {
        await validation.validateRequest({
          type: 'object',
          properties: {
            body: {
              type: 'object',
              properties: {
                token: { type: 'string' },
              },
              required: ['token'],
            },
          },
          required: ['body'],
        })(req, res, next);
      }
    },
    EnableTwoFactorAuthController.createHandler()
  );

  app.post(
    '/api/auth2fa-reset',
    needsAuthorization(['admin']),
    validatePasswordMiddleWare,
    async (req: Request, res: Response, next: NextFunction) => {
      if (tenants.current().featureFlags?.v2Auth2fa) {
        next();
      } else {
        await validation.validateRequest({
          type: 'object',
          properties: {
            body: {
              type: 'object',
              properties: {
                _id: ObjectIdAsString,
              },
              required: ['_id'],
            },
          },
          required: ['body'],
        })(req, res, next);
      }
    },
    ResetTwoFactorAuthController.createHandler()
  );
};
