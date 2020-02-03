import Joi from 'joi';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import proxy from 'express-http-proxy';

import entities from 'api/entities';
import { search } from 'api/search';
import CSVLoader from 'api/csv';
import { saveSchema } from 'api/entities/endpointSchema';
import { generateFileName } from 'api/utils/files';
import settings from 'api/settings';
import { processDocument } from 'api/upload/processDocument';

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

/*eslint-disable max-statements*/
export default app => {
  const upload = multer({ storage });

  const socket = req => req.getCurrentSessionSockets();

  // const uploadProcess = async (req, res, allLanguages = true) => {
  //   try {
  //     const docs = await getDocuments(req.body.document, allLanguages, req.language);
  //     await uploadFile(docs, req.files[0])
  //     .on('conversionStart', () => {
  //       res.json(req.files[0]);
  //       socket(req).emit('conversionStart', req.body.document);
  //     })
  //     .start();

  //     await search.indexEntities({ sharedId: req.body.document }, '+fullText');
  //     socket(req).emit('documentProcessed', req.body.document);
  //   } catch (err) {
  //     errorLog.error(err);
  //     debugLog.debug(err);
  //     socket(req).emit('conversionFailed', req.body.document);
  //   }
  // };

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
      const { allowedPublicTemplates } = await settings.get(true);
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
    const { publicFormDestination } = await settings.get(true);
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

  // app.post(
  //   '/api/reupload',

  //   needsAuthorization(['admin', 'editor']),

  //   upload.any(),

  //   validation.validateRequest(Joi.object({
  //     document: Joi.string().required()
  //   }).required()),

  //   (req, res, next) => entities.getById(req.body.document, req.language)
  //   .then((doc) => {
  //     let deleteReferences = Promise.resolve();
  //     if (doc.file) {
  //       deleteReferences = relationships.deleteTextReferences(doc.sharedId, doc.language);
  //     }
  //     return Promise.all([doc, deleteReferences]);
  //   })
  //   .then(([doc]) => entities.saveMultiple([{ _id: doc._id, toc: [] }]))
  //   .then(([{ sharedId }]) => entities.get({ sharedId }))
  //   .then(docs => docs.reduce((addToAllLanguages, doc) => addToAllLanguages && !doc.file, true))
  //   .then(addToAllLanguages => uploadProcess(req, res, addToAllLanguages))
  //   .catch(next)
  // );
};
