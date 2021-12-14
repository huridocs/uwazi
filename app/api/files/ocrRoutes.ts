import { Application, Request, Response, NextFunction } from 'express';
import { uploadsPath, fileExists } from 'api/files/filesystem';
import needsAuthorization from 'api/auth/authMiddleware';
import { OcrManagerInstance } from 'api/services/ocr/OcrManager';
import { files } from './files';
import { validation, createError } from '../utils';

const validateOcrIsEnabled = async (_req: Request, res: Response, next: NextFunction) => {
  if (!(await OcrManagerInstance.isEnabled())) {
    return res.sendStatus(404);
  }
  return next();
};

// eslint-disable-next-line import/no-default-export
export default (app: Application) => {
  app.get(
    '/api/files/:filename/ocr',
    validateOcrIsEnabled,
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
        const [file] = await files.get({
          filename: req.params.filename,
        });

        if (!file || !(await fileExists(uploadsPath(file.filename)))) {
          throw createError('file not found', 404);
        }

        const status = await OcrManagerInstance.getStatus(file);

        res.json(status);
      } catch (e) {
        next(e);
      }
    }
  );

  app.post(
    '/api/files/:filename/ocr',
    validateOcrIsEnabled,
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
        const [file] = await files.get({
          filename: req.params.filename,
        });

        if (!file || !(await fileExists(uploadsPath(file.filename)))) {
          throw createError('file not found', 404);
        }

        await OcrManagerInstance.addToQueue(file);

        res.sendStatus(200);
      } catch (e) {
        next(e);
      }
    }
  );
};
