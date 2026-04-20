import type { Application } from 'express';
import needsAuthorization from '#api/auth/authMiddleware.js';
import { UploadMiddleware } from '#api/core/infrastructure/express/middlewares/UploadMiddleware.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { CSVLoader } from '#api/csv/index.js';
import { uploadMiddleware } from '#api/files/uploadMiddleware.js';
import { handleError } from '#api/utils/index.js';
import { RegisterCsvImportController } from './RegisterCsvImportController.js';
import { ListCsvImportEntitiesImportsController } from './ListCsvImportEntitiesImportsController.js';
import { GetCsvImportEntitiesImportController } from './GetCsvImportEntitiesImportController.js';
import { CancelCsvImportEntitiesImportController } from './CancelCsvImportEntitiesImportController.js';
import { DownloadCsvImportFailedRowsCsvController } from './DownloadCsvImportFailedRowsCsvController.js';

const csvImportRoutes = (app: Application) => {
  // Legacy V1 route
  app.post(
    '/api/import',

    needsAuthorization(['admin']),

    async (req, res, next) => {
      await uploadMiddleware()(req, res, next);
    },

    // eslint-disable-next-line max-statements
    async (req, res) => {
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
    }
  );

  app.post(
    '/api/csvImportEntities',
    needsAuthorization(['admin']),
    async (req, res, next) => {
      await new UploadMiddleware(LoggerFactory.default()).singleUpload()(req, res, next);
    },
    RegisterCsvImportController.createHandler()
  );

  app.get(
    '/api/csvImportEntities/imports',
    needsAuthorization(['admin']),
    ListCsvImportEntitiesImportsController.createHandler()
  );

  app.get(
    '/api/csvImportEntities/imports/:id',
    needsAuthorization(['admin']),
    GetCsvImportEntitiesImportController.createHandler()
  );

  app.post(
    '/api/csvImportEntities/imports/:id/cancel',
    needsAuthorization(['admin']),
    CancelCsvImportEntitiesImportController.createHandler()
  );

  app.get(
    '/api/csvImportEntities/imports/:id/failed-rows-csv',
    needsAuthorization(['admin']),
    DownloadCsvImportFailedRowsCsvController.createHandler()
  );
};

export { csvImportRoutes };
