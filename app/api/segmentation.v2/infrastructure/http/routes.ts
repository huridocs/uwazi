import type { Application } from 'express';
import needsAuthorization from '#api/auth/authMiddleware.js';
import { DownloadFileSegmentationController } from './DownloadFileSegmentationController.js';

const segmentationV2Routes = (app: Application) => {
  app.get(
    '/api/v2/files/:id/segmentation',
    needsAuthorization(['admin']),
    DownloadFileSegmentationController.createHandler()
  );
};

export { segmentationV2Routes };
