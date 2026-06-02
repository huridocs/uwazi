import type { Application } from 'express';
import needsAuthorization from '#api/auth/authMiddleware.js';
import activitylogMiddleware from '#api/activitylog/activitylogMiddleware.js';
import { UploadMiddleware } from '#api/core/infrastructure/express/middlewares/UploadMiddleware.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { DownloadFileController } from '#api/core/infrastructure/express/DownloadFileController.js';
import { CustomFileUploadController } from './CustomFileUploadController.js';

export const customUploadsRoutes = (app: Application) => {
  app.post(
    '/api/files/upload/custom',
    needsAuthorization(['admin']),
    async (req, res, next) => {
      await new UploadMiddleware(LoggerFactory.default()).singleUpload('custom')(req, res, next);
    },
    activitylogMiddleware,
    CustomFileUploadController.createHandler()
  );

  app.get('/assets/:filename', DownloadFileController.customHandler(['custom']));
};

export default customUploadsRoutes;
