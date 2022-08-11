import { Application, Request, Response, NextFunction } from 'express';
import { storage } from 'api/files';
import needsAuthorization from 'api/auth/authMiddleware';
import { isOcrEnabled, ocrManager, getOcrStatus } from 'api/services/ocr/OcrManager';
import { files } from './files';
import { validation, createError } from '../utils';

const validateOcrIsEnabled = async (_req: Request, res: Response, next: NextFunction) => {
  if (!(await isOcrEnabled())) {
    return res.sendStatus(404);
  }
  return next();
};

const ocrRequestDecriptor = {
  type: 'object',
  properties: {
    params: {
      type: 'object',
      properties: {
        filename: { type: 'string' },
      },
    },
  },
};

const fileFromRequest = async (request: Request) => {
  const [file] = await files.get({
    filename: request.params.filename,
  });

  if (!file?.filename || !(await storage.fileExists(file.filename, 'document'))) {
    throw createError('file not found', 404);
  }

  return file;
};

const ocrRoutes = (app: Application) => {
  app.get(
    '/api/files/:filename/ocr',
    validateOcrIsEnabled,
    needsAuthorization(['admin', 'editor']),
    validation.validateRequest(ocrRequestDecriptor),
    async (req, res) => {
      const file = await fileFromRequest(req);

      const status = await getOcrStatus(file);

      res.json(status);
    }
  );

  app.post(
    '/api/files/:filename/ocr',
    validateOcrIsEnabled,
    needsAuthorization(['admin', 'editor']),
    validation.validateRequest(ocrRequestDecriptor),
    async (req, res) => {
      const file = await fileFromRequest(req);

      await ocrManager.addToQueue(file);

      res.sendStatus(200);
    }
  );
};

export { ocrRoutes };
