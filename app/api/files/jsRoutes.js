import cors from 'cors';
import proxy from 'express-http-proxy';
import activitylogMiddleware from '#api/activitylog/activitylogMiddleware.js';
import { UploadMiddleware } from '#api/core/infrastructure/express/middlewares/UploadMiddleware.js';
import { EntityFacade } from '#api/core/infrastructure/facades/EntitiesFacade.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { EntitiesDAOFactory } from '#api/core/infrastructure/factories/EntitiesDAOFactory.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import settings from '#api/settings/index.js';
import { PUBLIC_USER_ID } from '#api/core/domain/user/User.js';
import { publicAPIMiddleware } from '../auth/publicAPIMiddleware.js';
import { createError } from '../utils/index.js';
import { User } from '#api/users.v2/model/User.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

const getPublicUser = async () => {
  const usersModel = getConnection().collection('users');
  const publicUser = await usersModel.findOne({
    _id: PUBLIC_USER_ID,
    deletedAt: { $exists: false },
  });

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
      } catch (err) {
        next(err);
        return;
      }
      next();
    },
    async (req, res, next) => {
      const { allowedPublicTemplates } = await settings.get();
      const { entity } = req.body;

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
        ExecutionContext.actor = User.createFrom(userForContext);

        const result = await EntityFacade.create(entity, req.language, req.inputFiles);

        const [entityWithFiles] = await EntitiesDAOFactory.default({
          user: User.createFrom(userForContext),
        }).getWithFiles({
          language: req.language,
          sharedId: result.sharedId,
        });

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
