/** @format */

import path from 'path';
import multer from 'multer';
import { Application, Request, Response, NextFunction } from 'express';
//@ts-ignore
import sanitize from 'sanitize-filename';
import debugLog from 'api/log/debugLog';
import errorLog from 'api/log/errorLog';
import { processDocument } from 'api/files/processDocument';
import { uploadsPath } from 'api/files/filesystem';

import { validation, createError } from '../utils';
import needsAuthorization from '../auth/authMiddleware';
import { files } from './files';
import storageConfig from './storageConfig';

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
        res.json(req.file);
        await processDocument(req.body.entity, req.file);
        req.getCurrentSessionSockets().emit('documentProcessed', req.body.entity);
      } catch (err) {
        errorLog.error(err);
        debugLog.debug(err);
        req.getCurrentSessionSockets().emit('conversionFailed', req.body.document);
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
        const [file] = await files.get({ filename: req.params.filename });
        if (!file) {
          throw createError('file not found', 404);
        }

        const filename = file.filename || '';
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

    (req: Request, res: Response, next: NextFunction) => {
      files
        .delete(req.query)
        .then(result => {
          res.json(result);
        })
        .catch(next);
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
