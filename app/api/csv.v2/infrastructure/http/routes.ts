import needsAuthorization from '#api/auth/authMiddleware.js';
import { UploadMiddleware } from '#api/core/infrastructure/express/middlewares/UploadMiddleware.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { CSVLoader } from '#api/csv/index.js';
import { uploadMiddleware } from '#api/files/uploadMiddleware.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { handleError } from '#api/utils/index.js';
import { Application } from 'express';
import { ParamsDictionary, Request, Response } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { RegisterCsvImportController } from './RegisterCsvImportController.js';

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
      if (tenants.current().featureFlags?.v2CSVImport) {
        await new UploadMiddleware(LoggerFactory.default()).singleUpload()(req, res, next);
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
