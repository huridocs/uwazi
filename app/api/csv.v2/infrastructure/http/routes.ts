import type { Application } from 'express';
import needsAuthorization from '#api/auth/authMiddleware.js';
import { UploadMiddleware } from '#api/core/infrastructure/express/middlewares/UploadMiddleware.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { RegisterCsvImportController } from './RegisterCsvImportController.js';
import { ListCsvImportEntitiesImportsController } from './ListCsvImportEntitiesImportsController.js';
import { GetCsvImportEntitiesImportController } from './GetCsvImportEntitiesImportController.js';
import { CancelCsvImportEntitiesImportController } from './CancelCsvImportEntitiesImportController.js';
import { DownloadCsvImportFailedRowsCsvController } from './DownloadCsvImportFailedRowsCsvController.js';

const csvImportRoutes = (app: Application) => {
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
