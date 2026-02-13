import proxy from 'express-http-proxy';
import cors from 'cors';
import { EntityFacade } from '#api/core/infrastructure/facades/EntitiesFacade.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import activitylogMiddleware from '#api/activitylog/activitylogMiddleware.js';
import { UploadMiddleware } from '#api/core/infrastructure/express/middlewares/UploadMiddleware.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoEntityDAO } from '#api/core/infrastructure/mongodb/entity/MongoEntityDAO.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import settings from '#api/settings/index.js';
import { PUBLIC_USER_ID } from '#api/users/publicUser.js';
import mailer from '#api/utils/mailer.js';
import { publicAPIMiddleware } from '../auth/publicAPIMiddleware.js';
import { createError, validation } from '../utils.js';

const getPublicUser = async () => {
  const usersModel = getConnection().collection('users');
  const publicUser = await usersModel.findOne({ _id: PUBLIC_USER_ID });

  if (!publicUser) {
    throw createError('Public user not configured. Migration required.', 500);
  }

  return publicUser;
};

const routes = app => {
  const corsOptions = {
    origin: true,
    methods: 'POST',
    credentials: true,
    optionsSuccessStatus: 200,
  };

  app.options('/api/public', cors(corsOptions));
  app.post(
    '/api/public',
    cors(corsOptions),
    (req, res, next) => new UploadMiddleware(LoggerFactory.default()).multiple()(req, res, next),
    publicAPIMiddleware,
    activitylogMiddleware,
    (req, _res, next) => {
      try {
        req.body.entity = JSON.parse(req.body.entity);
        if (req.body.email) {
          req.body.email = JSON.parse(req.body.email);
        }
      } catch (err) {
        next(err);
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
            email: {
              type: 'object',
              properties: {
                to: { type: 'string' },
                from: { type: 'string' },
                text: { type: 'string' },
                html: { type: 'string' },
                subject: { type: 'string' },
              },
              required: ['to', 'from', 'text', 'subject'],
            },
          },
        },
      },
    }),
    async (req, res, next) => {
      const { allowedPublicTemplates } = await settings.get();
      const { entity, email } = req.body;

      if (entity._id) {
        next(createError('Unauthorized _id property', 403));
        return;
      }

      if (!allowedPublicTemplates || !allowedPublicTemplates.includes(entity.template)) {
        next(createError('Unauthorized public template', 403));
        return;
      }

      try {
        const userForContext = req.user || (await getPublicUser());

        if (!req.user) {
          req.user = userForContext;
        }

        permissionsContext.setUserInContext(userForContext);

        const result = await EntityFacade.create(entity, req.inputFiles);

        const entityDAO = new MongoEntityDAO(getConnection(), TransactionManagerFactory.default());
        const entityWithFiles = await entityDAO
          .getWithFile({ language: req.language, sharedId: result.sharedId })
          .next();

        if (email) {
          await mailer.send(email);
        }

        res.json(entityWithFiles);
      } catch (error) {
        next(error);
      }
    }
  );

  app.post('/api/remotepublic', async (req, res, next) => {
    const { publicFormDestination } = await settings.get({}, { publicFormDestination: 1 });
    proxy(publicFormDestination, {
      limit: '500mb',
      proxyReqPathResolver() {
        return '/api/public';
      },
      proxyReqOptDecorator(proxyReqOpts) {
        const { tenant, cookie, ...headers } = proxyReqOpts.headers;
        return {
          ...proxyReqOpts,
          headers: { ...headers },
        };
      },
    })(req, res, next);
  });
};

export default routes;
export { routes };
