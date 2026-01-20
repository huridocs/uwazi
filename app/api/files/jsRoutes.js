import activitylogMiddleware from '#api/activitylog/activitylogMiddleware.js';
import { saveEntity } from '#api/entities/entitySavingManager.js';
import { processDocument } from '#api/files/processDocument.js';
import { search } from '#api/search/index.js';
import settings from '#api/settings/index.js';
import mailer from '#api/utils/mailer.js';
import cors from 'cors';
import { withTransaction } from '#api/utils/withTransaction.js';
import proxy from 'express-http-proxy';
// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';
import { publicAPIMiddleware } from '#api/auth/publicAPIMiddleware.js';
import { createError, validation } from '#api/utils/index.js';
import { storage } from '#api/files/storage.js';
import { uploadMiddleware } from '#api/files/uploadMiddleware.js';

const processEntityDocument = async (req, entitySharedId) => {
  const file = req.files.find(_file => _file.fieldname.includes('file'));
  if (file) {
    await storage.storeFile(file.filename, createReadStream(file.path), 'document');
    await processDocument(entitySharedId, file);
    await search.indexEntities({ sharedId: entitySharedId }, '+fullText');
    req.emitToSessionSocket('documentProcessed', entitySharedId);
  }
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
    uploadMiddleware.multiple(),
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

      const result = await withTransaction(async () => {
        const { entity: savedEntity } = await saveEntity(entity, {
          user: {},
          language: req.language,
          socketEmiter: req.emitToSessionSocket,
          files: req.files,
        });

        await processEntityDocument(req, savedEntity.sharedId);

        if (email) {
          await mailer.send(email);
        }

        return savedEntity;
      }, 'POST /api/public');

      res.json(result);
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
