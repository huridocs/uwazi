/** @format */
// TEST!!!
import Joi from 'joi';

import needsAuthorization from 'api/auth/authMiddleware';
import * as usersUtils from 'api/auth2fa/usersUtils';
import { validation } from 'api/utils';
import { User } from 'api/users/usersModel';

/**
 * This will probably not be required once express types
 * are passed down through a .ts APP or SERVER
 */
type Middleware = (
  req: { user: User; body: any },
  res: { json: any },
  next: any
) => Promise<void> | void;
type Post = { (arg0: string, arg1: Middleware, arg2: Middleware, arg3?: Middleware): void };
type App = { post: Post };

export default (app: App) => {
  app.post(
    '/api/auth2fa-secret',
    needsAuthorization(['admin', 'editor']),
    validation.validateRequest(Joi.object().keys({})),
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
    needsAuthorization(['admin', 'editor']),
    validation.validateRequest(
      Joi.object()
        .keys({ token: Joi.string().required() })
        .required()
    ),
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
    validation.validateRequest(
      Joi.object()
        .keys({
          _id: Joi.string()
            .length(24)
            .alphanum()
            .required(),
        })
        .required()
    ),
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
