import activitylogMiddleware from 'api/activitylog/activitylogMiddleware';
import settings from 'api/settings';
import mailer from 'api/utils/mailer';
import cors from 'cors';
import proxy from 'express-http-proxy';
import { publicAPIMiddleware } from '../auth/publicAPIMiddleware';
import { createError, validation } from '../utils';
import { UploadMiddleware } from 'api/core/infrastructure/express/middlewares/UploadMiddleware';
import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
import { EntityFacade } from 'api/core/infrastructure/facades/EntitiesFacade';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { MongoEntityDAO } from 'api/core/infrastructure/mongodb/entity/MongoEntityDAO';

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

      // Create entity using V2
      const result = await EntityFacade.create(entity, req.inputFiles);

      // Fetch the full entity with files to match V1 response format
      const entityDAO = new MongoEntityDAO(getConnection(), TransactionManagerFactory.default());
      const entityWithFiles = await entityDAO
        .getWithFile({ language: req.language, sharedId: result.sharedId })
        .next();

      // Send email after successful entity creation
      if (email) {
        await mailer.send(email);
      }

      // Emit socket event for document processing completion
      if (req.emitToSessionSocket) {
        req.emitToSessionSocket('documentProcessed', result.sharedId);
      }

      res.json(entityWithFiles);
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
