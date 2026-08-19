import cookieParser from 'cookie-parser';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import session from 'express-session';
import { DB } from '#api/odm/index.js';
import { config } from '#api/config.js';
import { LoginController } from '#api/core/infrastructure/express/users/LoginController.js';
import { LogoutController } from '#api/core/infrastructure/express/users/LogoutController.js';
import { GetCurrentUserController } from '#api/core/infrastructure/express/users/GetCurrentUserController.js';

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
  app.post('/api/login', LoginController.createHandler());

  app.get('/api/user', GetCurrentUserController.createHandler());

  app.get('/logout', LogoutController.createHandler());
};

export { populateAuthenticatedUser, authenticatedUserMiddlewares };
export default authRoutes;
