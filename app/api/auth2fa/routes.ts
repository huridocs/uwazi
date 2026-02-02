import { Application } from 'express';
import needsAuthorization from '#api/auth/authMiddleware.js';
import * as usersUtils from '#api/auth2fa/usersUtils.js';
import { validation } from '#api/utils/index.js';
import { ObjectIdAsString } from '#api/utils/ajvSchemas.js';
import { validatePasswordMiddleWare } from '#api/auth/index.js';

export default (app: Application) => {
  app.post(
    '/api/auth2fa-secret',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    validation.validateRequest({
      type: 'object',
    }),
    async (req, res, next) => {
      try {
        const { otpauth, secret } = await usersUtils.setSecret(req.user);
        res.json({ otpauth, secret });
      } catch (err) {
        next(err);
      }
    }
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
