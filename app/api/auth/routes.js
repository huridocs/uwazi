import cookieParser from 'cookie-parser';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import session from 'express-session';
import svgCaptcha from 'svg-captcha';
import urljoin from 'url-join';
import cors from 'cors';
import settings from '#api/settings/index.js';
import { DB } from '#api/odm/index.js';
import { config } from '#api/config.js';
import request from '#shared/JSONRequest.js';
import { randomSleep } from '#shared/tsUtils.js';
import { tenants } from '#api/tenants/index.js';
import { LoginController } from '#api/core/infrastructure/express/users/LoginController.js';
import { LogoutController } from '#api/core/infrastructure/express/users/LogoutController.js';
import { GetCurrentUserController } from '#api/core/infrastructure/express/users/GetCurrentUserController.js';
import { CaptchaController } from '#api/core/infrastructure/express/captcha/CaptchaController.js';
import { RemoteCaptchaController } from '#api/core/infrastructure/express/captcha/RemoteCaptchaController.js';
import { CaptchaModel } from './CaptchaModel.js';

import { validation } from '#api/utils/index.js';

import './passport_conf.js';

// Must run before dependenciesContextMiddleware, which snapshots the authenticated
// user into ExecutionContext.actor and therefore needs req.user already deserialized.
const authenticatedUserMiddlewares = () => [
  cookieParser(),
  session({
    secret: process.env.NODE_ENV === 'production' ? config.userSessionSecret : 'harvey&lola',
    store: MongoStore.create({
      touchAfter: 24 * 3600,
      dbName: config.SHARED_DB,
      client: DB.connectionForDB(config.SHARED_DB, {
        useCache: true,
        noListener: false,
      }).getClient(),
    }),
    resave: false,
    saveUninitialized: false,
  }),
  passport.initialize(),
  passport.session(),
];

const populateAuthenticatedUser = app => {
  authenticatedUserMiddlewares().forEach(middleware => app.use(middleware));
};

const authRoutes = app => {
  app.post(
    '/api/login',

    async (req, res, next) => {
      await randomSleep(500, 1_000);

      if (tenants.current().featureFlags?.v2Login) {
        await LoginController.createHandler()(req, res);
        return;
      }

      next();
    },

    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          properties: {
            username: { type: 'string', minLength: 1 },
            password: { type: 'string', minLength: 1 },
            token: { type: 'string' },
          },
          required: ['username', 'password'],
        },
      },
      required: ['body'],
    }),

    // @deprecated v1 fallback for the `v2Login` flag, superseded by LoginController above.
    // Remove once v2Login is enabled for all tenants.
    async (req, res, next) => {
      passport.authenticate('local', (err, user) => {
        if (err) {
          next(err);
          return;
        }
        req.logIn(user, error => {
          if (error) {
            next(error);
            return;
          }
          res.status(200);
          res.json({ success: true });
        });
      })(req, res, next);
    }
  );

  app.get('/api/user', async (req, res) => {
    if (tenants.current().featureFlags?.v2Login) {
      await GetCurrentUserController.createHandler()(req, res);
      return;
    }

    // @deprecated v1 fallback for the `v2Login` flag, superseded by GetCurrentUserController above.
    // Remove once v2Login is enabled for all tenants.
    res.json(req.user || {});
  });

  app.get('/logout', async (req, res) => {
    if (tenants.current().featureFlags?.v2Login) {
      await LogoutController.createHandler()(req, res);
      return;
    }

    // @deprecated v1 fallback for the `v2Login` flag, superseded by LogoutController above.
    // Remove once v2Login is enabled for all tenants.
    req.session.destroy();
    res.redirect('/');
  });

  const corsOptions = {
    origin: true,
    methods: 'GET',
    credentials: true,
    optionsSuccessStatus: 200,
  };

  app.get('/api/captcha', cors(corsOptions), async (req, res) => {
    if (tenants.current().featureFlags?.v2Captcha) {
      await CaptchaController.createHandler()(req, res);
      return;
    }

    // @deprecated v1 fallback for the `v2Captcha` flag, superseded by CaptchaController.
    // Remove once v2Captcha is enabled for all tenants.
    const captcha = svgCaptcha.create({ ignoreChars: '0OoiILluvUV' });
    const text = process.env.DATABASE_NAME !== 'uwazi_e2e' ? captcha.text : '42hf';
    const storedCaptcha = await CaptchaModel.save({ text });

    res.json({ svg: captcha.data, id: storedCaptcha._id.toString() });
  });

  app.get('/api/remotecaptcha', async (req, res) => {
    if (tenants.current().featureFlags?.v2Captcha) {
      await RemoteCaptchaController.createHandler()(req, res);
      return;
    }

    // @deprecated v1 fallback for the `v2Captcha` flag, superseded by RemoteCaptchaController.
    // Remove once v2Captcha is enabled for all tenants.
    const { publicFormDestination } = await settings.get({}, { publicFormDestination: 1 });
    const remoteResponse = await request.get(urljoin(publicFormDestination, '/api/captcha'));
    res.json(remoteResponse.json);
  });
};

export { populateAuthenticatedUser, authenticatedUserMiddlewares };
export default authRoutes;
