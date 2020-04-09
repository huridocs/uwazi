/*eslint-disable max-statements*/

import Joi from 'joi';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import proxy from 'express-http-proxy';

import entities from 'api/entities';
import { search } from 'api/search';
import CSVLoader, { CSVExporter } from 'api/csv';
import { saveSchema } from 'api/entities/endpointSchema';
import { generateFileName, temporalFilesPath } from 'api/files/filesystem';
import settings from 'api/settings';
import { processDocument } from 'api/files/processDocument';

import errorLog from 'api/log/errorLog';
import configPaths from '../config/paths';
import { validation, handleError, createError } from '../utils';
import needsAuthorization from '../auth/authMiddleware';
import captchaAuthorization from '../auth/captchaMiddleware';
import storageConfig from './storageConfig';

const storage = multer.diskStorage(storageConfig);

const storeFile = file =>
  new Promise((resolve, reject) => {
    const filename = generateFileName(file);
    const destination = configPaths.uploadedDocuments;
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
      req.body = JSON.parse(req.body.entity);
      return next();
    },
    validation.validateRequest(saveSchema),
    async (req, res, next) => {
      const entity = req.body;
      const { allowedPublicTemplates } = await settings.get();
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
      res.json(newEntity);
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

  const parseQueryProperty = (query, property) =>
    query[property] ? JSON.parse(query[property]) : query[property];

  const generateExportFileName = databaseName => `${databaseName}-${new Date().toISOString()}.csv`;

  app.get(
    '/api/export',
    validation.validateRequest({
      properties: {
        query: {
          properties: {
            filters: { type: 'string' },
            types: { type: 'string' },
            _types: { type: 'string' },
            fields: { type: 'string' },
            allAggregations: { type: 'string' },
            userSelectedSorting: { type: 'string' },
            aggregations: { type: 'string' },
            order: { type: 'string' },
            sort: { type: 'string' },
            limit: { type: 'string' },
            searchTerm: { type: 'string' },
            includeUnpublished: { type: 'boolean' },
            treatAs: { type: 'string' },
            unpublished: { type: 'boolean' },
            select: { type: 'array', items: [{ type: 'string' }] },
            ids: { type: 'array', items: [{ type: 'string' }] },
          },
        },
      },
    }),
    (req, res, next) => {
      req.query.filters = parseQueryProperty(req.query, 'filters');
      req.query.types = parseQueryProperty(req.query, 'types');
      req.query.fields = parseQueryProperty(req.query, 'fields');
      req.query.aggregations = parseQueryProperty(req.query, 'aggregations');
      req.query.select = parseQueryProperty(req.query, 'select');
      req.query.unpublished = parseQueryProperty(req.query, 'unpublished');
      req.query.includeUnpublished = parseQueryProperty(req.query, 'includeUnpublished');
      req.query.ids = parseQueryProperty(req.query, 'ids');

      Promise.all([search.search(req.query, req.language, req.user), settings.get()]).then(
        // eslint-disable-next-line camelcase
        ([results, { dateFormat, site_name }]) => {
          const exporter = new CSVExporter();
          const temporalFilePath = temporalFilesPath(
            generateFileName({ originalname: 'export.csv' })
          );
          const fileStream = fs.createWriteStream(temporalFilePath, { emitClose: true });
          const exporterOptions = { dateFormat };

          exporter
            .export(results, req.query.types, fileStream, exporterOptions)
            .then(() => {
              fileStream.end(() => {
                res.download(temporalFilePath, generateExportFileName(site_name), () => {
                  fs.unlink(temporalFilePath, err => {
                    if (err) errorLog.error(`Error unlinking exported file: ${temporalFilePath}`);
                  });
                });
              });
            })
            .catch(e => {
              fs.unlink(temporalFilePath, err => {
                if (err) errorLog.error(`Error unlinking exported file: ${temporalFilePath}`);
              });
              next(e);
            });
        }
      );
    }
  );
};
