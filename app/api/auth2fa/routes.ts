import type { Application, NextFunction, Request, Response } from 'express';
import needsAuthorization from '#api/auth/authMiddleware.js';
import * as usersUtils from '#api/auth2fa/usersUtils.js';
import { validation } from '#api/utils/index.js';
import { ObjectIdAsString } from '#api/utils/ajvSchemas.js';
import { validatePasswordMiddleWare } from '#api/auth/index.js';
import { tenants } from '#api/tenants/index.js';
import { GenerateTwoFactorSecretController } from '#api/core/infrastructure/express/users/GenerateTwoFactorSecretController.js';

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
    validation.validateRequest({
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
    }),
    async (req, res, next) => {
      try {
        await usersUtils.enable2fa(req.user, req.body.token);
        res.json({ success: true });
      } catch (err) {
        next(err);
      }
    }
  );

  app.post(
    '/api/auth2fa-reset',
    needsAuthorization(['admin']),
    validatePasswordMiddleWare,
    validation.validateRequest({
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
    }),
    async (req, res, next) => {
      try {
        await usersUtils.reset2fa({ _id: req.body._id });
        res.json({ success: true });
      } catch (err) {
        next(err);
      }
    }
  );
};
