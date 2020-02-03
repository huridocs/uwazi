/** @format */

import multer from 'multer';
import { Application, Request, Response, NextFunction } from 'express';
import debugLog from 'api/log/debugLog';
import errorLog from 'api/log/errorLog';
import { processDocument } from 'api/upload/processDocument';

import { validation } from '../utils';
import needsAuthorization from '../auth/authMiddleware';
import uploads from './uploads';
import storageConfig from './storageConfig';

const storage = multer.diskStorage(storageConfig);
const upload = multer({ storage });

export default (app: Application) => {
  app.post(
    '/api/upload/document',
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
