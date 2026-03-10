import { Application } from 'express';
import needsAuthorization from 'api/auth/authMiddleware';
import activitylogMiddleware from 'api/activitylog/activitylogMiddleware';
import { UploadMiddleware } from 'api/core/infrastructure/express/middlewares/UploadMiddleware';
import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
import { DownloadFileController } from 'api/core/infrastructure/express/DownloadFileController';
import { CustomFileUploadController } from './CustomFileUploadController';

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
