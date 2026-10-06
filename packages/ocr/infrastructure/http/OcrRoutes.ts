import type { Application } from 'express';
import needsAuthorization from '#api/auth/authMiddleware.js';
import { OcrStatusController } from './OcrStatusController.js';
import { RequestOcrController } from './RequestOcrController.js';

class OcrRoutes {
  static register(app: Application) {
    app.get(
      '/api/files/:filename/ocr',
      needsAuthorization(['admin', 'editor']),
      OcrStatusController.createHandler()
    );

    app.post(
      '/api/files/:filename/ocr',
      needsAuthorization(['admin', 'editor']),
      RequestOcrController.createHandler()
    );
  }
}

export { OcrRoutes };
