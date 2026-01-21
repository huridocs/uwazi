import { Application } from 'express';
import needsAuthorization from '#api/auth/authMiddleware.js';
import { uploadMiddleware } from '#api/files/uploadMiddleware.js';
import { handleError } from '#api/utils/index.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { CSVLoader } from '#api/csv/index.js';
import multer from 'multer';
import { generateFileName } from '#api/files/filesystem.js';
import { Request, ParamsDictionary, Response } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { RegisterCsvImportController } from '#api/csv.v2/infrastructure/http/RegisterCsvImportController.js';
import { tenants } from '#api/tenants/index.js';

const csvImportRoutes = (app: Application) => {
  // eslint-disable-next-line max-statements
  const v1Import = async (
    req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
    res: Response<any, Record<string, any>, number>
  ) => {
    if (!req.file) throw new Error('File is not available on request object');

    const template = req.body?.template;
    if (typeof template !== 'string') {
      res.status(400).json({ message: 'Request body must include template:string' });
      return;
    }

    const loader = new CSVLoader();
    let loaded = 0;

    loader.on('entityLoaded', () => {
      loaded += 1;
      req.emitToSessionSocket('IMPORT_CSV_PROGRESS', loaded);
    });

    loader.on('rowExceptions', (exceptions: unknown) => {
      req.emitToSessionSocket('IMPORT_CSV_ROW_EXCEPTIONS', exceptions);
    });

    loader.on('loadError', (error: Error) => {
      req.emitToSessionSocket('IMPORT_CSV_ERROR', handleError(error));
    });

    req.emitToSessionSocket('IMPORT_CSV_START');

    loader
      .load(req.file.path, template, { language: req.language, user: req.user })
      .then(() => {
        req.emitToSessionSocket('IMPORT_CSV_END');
      })
      .catch((e: Error) => {
        req.emitToSessionSocket('IMPORT_CSV_ERROR', handleError(e));
      });

    res.json('ok');
  };

  app.post(
    '/api/import',

    needsAuthorization(['admin']),

    async (req, res, next) => {
      if (tenants.current().featureFlags?.v2UploadFile) {
        const defaultStorage = multer.diskStorage({
          filename(_req, file: Express.Multer.File, cb) {
            cb(null, generateFileName(file));
          },
        });
        await new Promise<void>((resolve, reject) => {
          multer({ storage: defaultStorage }).single('file')(req, res, err => {
            if (!err) resolve();
            reject(err);
          });
        });
        next();
      } else {
        await uploadMiddleware()(req, res, next);
      }
    },

    async (req, res) => {
      if (tenants.current().featureFlags?.v2CSVImport) {
        const handler = RegisterCsvImportController.createHandler();
        return handler(req, res);
      }
      await v1Import(req, res);
      return undefined;
    }
  );
};

export { csvImportRoutes };
