/** @format */

import path from 'path';
import multer from 'multer';
import { Application, Request, Response, NextFunction } from 'express';
//@ts-ignore
import sanitize from 'sanitize-filename';
import debugLog from 'api/log/debugLog';
import errorLog from 'api/log/errorLog';
import { processDocument } from 'api/upload/processDocument';
import { uploadsPath } from 'api/utils/files';

import { validation, createError } from '../utils';
import needsAuthorization from '../auth/authMiddleware';
import uploads from './uploads';
import storageConfig from './storageConfig';

const storage = multer.diskStorage(storageConfig);
const upload = multer({ storage });

export default (app: Application) => {
  app.post(
    '/api/documents/upload',
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

  app.get(
    '/api/download',
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
        const [file] = await uploads.get({ _id: req.query._id });
        if (!file) {
          throw createError('file not found', 404);
        }
        const originalname = file.originalname || '';
        const filename = file.filename || '';
        const basename = path.basename(originalname, path.extname(originalname));
        res.download(uploadsPath(filename), sanitize(basename + path.extname(filename)));
      } catch (e) {
        next(e);
      }
    }
  );

  app.delete(
    '/api/upload/document',
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
      uploads
        .delete(req.query._id)
        .then(result => {
          res.json(result);
        })
        .catch(next);
    }
  );

  app.post(
    '/api/customisation/upload',
    needsAuthorization(['admin', 'editor']),
    upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
      uploads
        .save({ ...req.file, type: 'custom' })
        .then(saved => {
          res.json(saved);
        })
        .catch(next);
    }
  );

  app.get(
    '/api/customisation/upload',
    needsAuthorization(['admin', 'editor']),
    (_req: Request, res: Response, next: NextFunction) => {
      uploads
        .get({ type: 'custom' })
        .then(result => {
          res.json(result);
        })
        .catch(next);
    }
  );

  app.delete(
    '/api/customisation/upload',
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
      uploads
        .delete(req.query._id)
        .then(result => {
          res.json(result);
        })
        .catch(next);
    }
  );
};
