import { Application } from 'express';
import { debugLog, errorLog } from 'api/log';
import { processDocument } from 'api/files/processDocument';
import { uploadsPath, fileExists, customUploadsPath, attachmentsPath } from 'api/files/filesystem';
import needsAuthorization from 'api/auth/authMiddleware';
import { uploadMiddleware } from 'api/files/uploadMiddleware';
import activitylogMiddleware from 'api/activitylog/activitylogMiddleware';
import { CSVLoader } from 'api/csv';
import { fileSchema } from 'shared/types/fileSchema';
import { files } from './files';
import { validation, createError, handleError } from '../utils';
import OcrManager from 'api/services/ocr/OcrManager';

export default (app: Application) => {
  app.post(
    '/api/files/upload/document',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    uploadMiddleware(uploadsPath),
    async (req, res) => {
      try {
        req.emitToSessionSocket('conversionStart', req.body.entity);
        const savedFile = await processDocument(req.body.entity, req.file);
        res.json(savedFile);
        req.emitToSessionSocket('documentProcessed', req.body.entity);
      } catch (err) {
        errorLog.error(err);
        debugLog.debug(err);
        const [file] = await files.get({ filename: req.file.filename });
        res.json(file);
        req.emitToSessionSocket('conversionFailed', req.body.entity);
      }
    },
    activitylogMiddleware
  );

  app.post(
    '/api/files/upload/custom',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    uploadMiddleware(customUploadsPath),
    activitylogMiddleware,
    (req, res, next) => {
      files
        .save({ ...req.file, type: 'custom' })
        .then(saved => {
          res.json(saved);
        })
        .catch(next);
    }
  );

  app.post(
    '/api/files/upload/attachment',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    uploadMiddleware(attachmentsPath),
    activitylogMiddleware,
    (req, res, next) => {
      files
        .save({ ...req.file, ...req.body, type: 'attachment' })
        .then(saved => {
          res.json(saved);
        })
        .catch(next);
    }
  );

  app.post(
    '/api/files',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: fileSchema,
      },
    }),
    (req, res, next) => {
      files
        .save(req.body)
        .then(result => {
          res.json(result);
        })
        .catch(next);
    }
  );

  app.post(
    '/api/files/tocReviewed',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    validation.validateRequest({
      properties: {
        body: {
          required: ['fileId'],
          properties: {
            fileId: { type: 'string' },
          },
        },
      },
    }),
    async (req, res, next) => {
      try {
        res.json(await files.tocReviewed(req.body.fileId, req.language));
      } catch (e) {
        next(e);
      }
    }
  );

  app.get(
    '/api/files/:filename',
    validation.validateRequest({
      properties: {
        params: {
          properties: {
            filename: { type: 'string' },
          },
        },
      },
    }),

    async (req, res, next) => {
      try {
        const [file = { filename: '', originalname: undefined }] = await files.get({
          filename: req.params.filename,
        });

        const filename = file.filename || '';

        if (!filename || !(await fileExists(uploadsPath(filename)))) {
          throw createError('file not found', 404);
        }

        if (file.originalname) {
          res.setHeader(
            'Content-Disposition',
            `filename*=UTF-8''${encodeURIComponent(file.originalname)}`
          );
        }

        res.sendFile(uploadsPath(filename));
      } catch (e) {
        next(e);
      }
    }
  );

  app.delete(
    '/api/files',
    needsAuthorization(['admin', 'editor', 'collaborator']),

    validation.validateRequest({
      properties: {
        query: {
          required: ['_id'],
          properties: {
            _id: { type: 'string' },
          },
        },
      },
    }),

    async (req, res, next) => {
      try {
        const [deletedFile] = await files.delete(req.query);
        const thumbnailFileName = `${deletedFile._id}.jpg`;
        await files.delete({ filename: thumbnailFileName });
        res.json([deletedFile]);
      } catch (e) {
        next(e);
      }
    }
  );

  app.get(
    '/api/files',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    (req, res, next) => {
      files
        .get(req.query)
        .then(result => {
          res.json(result);
        })
        .catch(next);
    }
  );

  app.post(
    '/api/import',

    needsAuthorization(['admin']),

    uploadMiddleware(),

    validation.validateRequest({
      properties: {
        body: {
          required: ['template'],
          properties: {
            template: { type: 'string' },
          },
        },
      },
    }),

    (req, res) => {
      const loader = new CSVLoader();
      let loaded = 0;

      loader.on('entityLoaded', () => {
        loaded += 1;
        req.emitToSessionSocket('IMPORT_CSV_PROGRESS', loaded);
      });

      loader.on('loadError', error => {
        req.emitToSessionSocket('IMPORT_CSV_ERROR', handleError(error));
      });

      req.emitToSessionSocket('IMPORT_CSV_START');

      loader
        .load(req.file.path, req.body.template, { language: req.language, user: req.user })
        .then(() => {
          req.emitToSessionSocket('IMPORT_CSV_END');
        })
        .catch((e: Error) => {
          req.emitToSessionSocket('IMPORT_CSV_ERROR', handleError(e));
        });

      res.json('ok');
    }
  );

  app.get(
    '/api/files/:filename/ocr',
    needsAuthorization(['admin', 'editor']),
    validation.validateRequest({
      properties: {
        params: {
          properties: {
            filename: { type: 'string' },
          },
        },
      },
    }),
    async (req, res, next) => {
      try {
        //TODO: validate feature enabled

        const [file] = await files.get({
          filename: req.params.filename,
        });

        if (!file || !(await fileExists(uploadsPath(file.filename)))) {
          throw createError('file not found', 404);
        }

        const status = await OcrManager.getStatus(file);

        res.json({ status });
      } catch (e) {
        next(e);
      }
    }
  );

  app.post(
    '/api/files/:filename/ocr',
    needsAuthorization(['admin', 'editor']),
    validation.validateRequest({
      properties: {
        params: {
          properties: {
            filename: { type: 'string' },
          },
        },
      },
    }),
    async (req, res, next) => {
      try {
        //TODO: validate feature enabled
        //TODO: validate file is document

        const [file] = await files.get({
          filename: req.params.filename,
        });

        if (!file || !(await fileExists(uploadsPath(file.filename)))) {
          throw createError('file not found', 404);
        }

        await OcrManager.addToQueue(file);

        res.sendStatus(200);
      } catch (e) {
        next(e);
      }
    }
  );
};
