/* eslint-disable max-statements */
import { Application, Request } from 'express';

import activitylogMiddleware from 'api/activitylog/activitylogMiddleware';
import needsAuthorization from 'api/auth/authMiddleware';
import { CSVLoader } from 'api/csv';
import entities from 'api/entities';
import { processDocument } from 'api/files/processDocument';
import { uploadMiddleware } from 'api/files/uploadMiddleware';
import { debugLog, errorLog } from 'api/log';
import { FileType } from 'shared/types/fileType';
import { fileSchema } from 'shared/types/fileSchema';
import { validateAndCoerceRequest } from 'api/utils/validateRequest';
import Joi from 'joi';
import { files } from './files';
import { createError, handleError, validation } from '../utils';
import { storage } from './storage';

const checkEntityPermission = async (file: FileType): Promise<boolean> => {
  if (!file.entity) return true;
  const relatedEntities = await entities.get({ sharedId: file.entity }, '_id', {
    withoutDocuments: true,
  });
  return !!relatedEntities.length;
};

const filterByEntityPermissions = async (fileList: FileType[]): Promise<FileType[]> => {
  const sharedIds = fileList.map(f => f.entity).filter(f => f);
  const allowedSharedIds = await entities
    .get({ sharedId: { $in: sharedIds } }, 'sharedId', {
      withoutDocuments: true,
    })
    .then((arr: { sharedId: string }[]) => new Set(arr.map(e => e.sharedId)));
  return fileList.filter(f => !f.entity || allowedSharedIds.has(f.entity));
};

export default (app: Application) => {
  app.post(
    '/api/files/upload/document',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    uploadMiddleware('document'),
    async (req, res) => {
      if (!req.file) throw new Error('File is not available on request object');
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
    uploadMiddleware('custom'),
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
    uploadMiddleware('attachment'),
    activitylogMiddleware,
    (req, res, next) => {
      files
        .save({
          ...req.file,
          ...req.body,
          type: 'attachment',
        })
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
      type: 'object',
      properties: {
        body: {
          type: 'object',
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

  app.use('/assets/:fileName', (req, res) => {
    res.redirect(301, `/api/files/${req.params.fileName}`);
  });

  app.use('/uploaded_documents/:fileName', (req, res) => {
    res.redirect(301, `/api/files/${req.params.fileName}`);
  });

  app.get(
    '/api/attachments/download',

    validation.validateRequest(
      Joi.object({
        _id: Joi.string(),
        file: Joi.string().required(),
      }).required(),
      'query'
    ),

    async (req, res) => {
      res.redirect(301, `/api/files/${req.query.file}?download=true`);
    }
  );

  app.get(
    '/api/files/:filename',
    validateAndCoerceRequest({
      type: 'object',
      properties: {
        params: {
          type: 'object',
          required: ['filename'],
          properties: {
            filename: { type: 'string' },
          },
        },
        query: {
          type: 'object',
          properties: {
            download: { type: 'boolean' },
          },
        },
      },
    }),

    async (req: Request<{ filename: string }, {}, {}, { download?: boolean }>, res) => {
      const [file] = await files.get({
        filename: req.params.filename,
      });

      if (
        !file?.filename ||
        !file?.type ||
        !(await storage.fileExists(file.filename, file.type)) ||
        !(await checkEntityPermission(file))
      ) {
        throw createError('file not found', 404);
      }

      const headerFilename = file.originalname || file.filename;

      res.setHeader(
        'Content-Disposition',
        `filename*=UTF-8''${encodeURIComponent(headerFilename)}`
      );
      res.setHeader('Content-Type', file?.mimetype || 'application/octet-stream');

      if (req.query.download === true) {
        res.setHeader(
          'Content-Disposition',
          `attachment; filename*=UTF-8''${encodeURIComponent(headerFilename)}`
        );
      }

      const { range } = req.headers;
      const fileSize = file.size;

      if (range && fileSize) {
        console.log('requesting range: ', range);
        const parts = range.replace(/bytes=/, '').split('-');
        const defaultEnd = fileSize > 1048576 ? 1048576 - 1 : fileSize - 1;
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : defaultEnd;
        const chunkSize = end - start + 1;

        res.setHeader('Content-Range', `bytes ${start} - ${end}/${fileSize}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', chunkSize);
        res.status(206);

        (await storage.readableFile(file.filename, file.type)).pipe(res);
      } else {
        (await storage.readableFile(file.filename, file.type)).pipe(res);
      }
    }
  );

  app.delete(
    '/api/files',
    needsAuthorization(['admin', 'editor', 'collaborator']),

    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          required: ['_id'],
          additionalProperties: false,
          properties: {
            _id: { type: 'string' },
          },
        },
      },
    }),

    async (req: Request<{}, {}, {}, { _id: string }>, res) => {
      const [fileToDelete] = await files.get({ _id: req.query._id });
      if (!fileToDelete || !(await checkEntityPermission(fileToDelete))) {
        throw createError('file not found', 404);
      }

      const [deletedFile] = await files.delete({ _id: req.query._id });
      const thumbnailFileName = `${deletedFile._id}.jpg`;
      await files.delete({ filename: thumbnailFileName });
      res.json([deletedFile]);
    }
  );

  app.get(
    '/api/files',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          additionalProperties: false,
          properties: {
            _id: { type: 'string' },
            type: { type: 'string' },
          },
        },
      },
    }),
    (req, res, next) => {
      files
        .get(req.query)
        .then(async result => filterByEntityPermissions(result))
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
      type: 'object',
      properties: {
        body: {
          type: 'object',
          required: ['template'],
          properties: {
            template: { type: 'string' },
          },
        },
      },
    }),

    (req, res) => {
      if (!req.file) throw new Error('File is not available on request object');

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
};
