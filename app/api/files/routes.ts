import multer from 'multer';
import { Application, Request, Response, NextFunction } from 'express';
//@ts-ignore
import debugLog from 'api/log/debugLog';
import errorLog from 'api/log/errorLog';
import { processDocument } from 'api/files/processDocument';
import { uploadsPath, fileExists } from 'api/files/filesystem';

import needsAuthorization from 'api/auth/authMiddleware';
import storageConfig from 'api/files/storageConfig';
import { files } from './files';
import { validation, createError } from '../utils';

const storage = multer.diskStorage(storageConfig);
const upload = multer({ storage });

export default (app: Application) => {
  app.post(
    '/api/files/upload/document',
    needsAuthorization(['admin', 'editor']),
    upload.single('file'),
    async (req: Request, res: Response, _next: NextFunction) => {
      try {
        req.getCurrentSessionSockets().emit('conversionStart', req.body.entity);
        const savedFile = await processDocument(req.body.entity, req.file);
        res.json(savedFile);
        req.getCurrentSessionSockets().emit('documentProcessed', req.body.entity);
      } catch (err) {
        errorLog.error(err);
        debugLog.debug(err);
        const [file] = await files.get({ filename: req.file.filename });
        res.json(file);
        req.getCurrentSessionSockets().emit('conversionFailed', req.body.entity);
      }
    }
  );

  app.post(
    '/api/files/upload/custom',
    needsAuthorization(['admin', 'editor']),
    upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
      files
        .save({ ...req.file, type: 'custom' })
        .then(saved => {
          res.json(saved);
        })
        .catch(next);
    }
  );

  app.post(
    '/api/files',
    needsAuthorization(['admin', 'editor']),
    (req: Request, res: Response, next: NextFunction) => {
      files
        .save(req.body)
        .then(result => {
          res.json(result);
        })
        .catch(next);
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

    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const [file = { filename: '' }] = await files.get({ filename: req.params.filename });

        const filename = file.filename || '';

        if (!filename || !(await fileExists(uploadsPath(filename)))) {
          throw createError('file not found', 404);
        }

        res.sendFile(uploadsPath(filename));
      } catch (e) {
        next(e);
      }
    }
  );

  app.delete(
    '/api/files',
    needsAuthorization(['admin', 'editor']),

    validation.validateRequest({
      properties: {
        query: {
          properties: {
            _id: { type: 'string' },
          },
        },
      },
    }),

    async (req: Request, res: Response, next: NextFunction) => {
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
    needsAuthorization(['admin', 'editor']),
    (req: Request, res: Response, next: NextFunction) => {
      files
        .get(req.query)
        .then(result => {
          res.json(result);
        })
        .catch(next);
    }
  );
};
