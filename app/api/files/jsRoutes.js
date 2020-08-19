import Joi from 'joi';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import proxy from 'express-http-proxy';

import entities from 'api/entities';
import mailer from 'api/utils/mailer';
import { search } from 'api/search';
import { CSVLoader } from 'api/csv';
import { generateFileName } from 'api/files/filesystem';
import settings from 'api/settings';
import { processDocument } from 'api/files/processDocument';

import { uploadsPath } from 'api/files/filesystem';
import { validation, handleError, createError } from '../utils';
import needsAuthorization from '../auth/authMiddleware';
import captchaAuthorization from '../auth/captchaMiddleware';
import storageConfig from './storageConfig';

const storage = multer.diskStorage(storageConfig);

const storeFile = file =>
  new Promise((resolve, reject) => {
    const filename = generateFileName(file);
    const destination = uploadsPath();
    const pathToFile = path.join(destination, filename);
    fs.appendFile(pathToFile, file.buffer, err => {
      if (err) {
        reject(err);
      }
      resolve(Object.assign(file, { filename, destination }));
    });
  });

export default app => {
  const upload = multer({ storage });

  const socket = req => req.getCurrentSessionSockets();

  app.post(
    '/api/public',
    multer().any(),
    captchaAuthorization(),
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
      properties: {
        body: {
          properties: {
            email: {
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
      try {
        const { allowedPublicTemplates } = await settings.get();
        const { entity, email } = req.body;

        if (!allowedPublicTemplates || !allowedPublicTemplates.includes(entity.template)) {
          next(createError('Unauthorized public template', 403));
          return;
        }

        entity.attachments = [];
        if (req.files.length) {
          await Promise.all(
            req.files
              .filter(file => file.fieldname.includes('attachment'))
              .map(file => storeFile(file).then(_file => entity.attachments.push(_file)))
          );
        }
        const newEntity = await entities.save(entity, { user: {}, language: req.language });
        const file = req.files.find(_file => _file.fieldname.includes('file'));
        if (file) {
          storeFile(file).then(async _file => {
            await processDocument(newEntity.sharedId, _file);
            await search.indexEntities({ sharedId: newEntity.sharedId }, '+fullText');
            socket(req).emit('documentProcessed', newEntity.sharedId);
          });
        }

        if (email) {
          await mailer.send(email);
        }

        res.json(newEntity);
      } catch (err) {
        next(err);
      }
    }
  );

  app.post('/api/remotepublic', async (req, res, next) => {
    const { publicFormDestination } = await settings.get({}, { publicFormDestination: 1 });
    proxy(publicFormDestination, {
      limit: '20mb',
      proxyReqPathResolver() {
        return '/api/public';
      },
      proxyReqOptDecorator(proxyReqOpts, srcReq) {
        const options = Object.assign({}, proxyReqOpts);
        options.headers.Cookie = srcReq.session.remotecookie;
        return options;
      },
    })(req, res, next);
  });

  app.post(
    '/api/import',

    needsAuthorization(['admin']),

    upload.any(),

    validation.validateRequest(
      Joi.object({
        template: Joi.string().required(),
      }).required()
    ),

    (req, res) => {
      const loader = new CSVLoader();
      let loaded = 0;

      loader.on('entityLoaded', () => {
        loaded += 1;
        req.getCurrentSessionSockets().emit('IMPORT_CSV_PROGRESS', loaded);
      });

      loader.on('loadError', error => {
        req.getCurrentSessionSockets().emit('IMPORT_CSV_ERROR', handleError(error));
      });

      req.getCurrentSessionSockets().emit('IMPORT_CSV_START');
      loader
        .load(req.files[0].path, req.body.template, { language: req.language, user: req.user })
        .then(() => {
          req.getCurrentSessionSockets().emit('IMPORT_CSV_END');
        })
        .catch(e => {
          req.getCurrentSessionSockets().emit('IMPORT_CSV_ERROR', handleError(e));
        });

      res.json('ok');
    }
  );
};
