import { Application } from 'express';
import needsAuthorization from '#api/auth/authMiddleware.js';
import { ListDatavizController } from './ListDatavizController.js';
import { CreateDatavizController } from './CreateDatavizController.js';
import { GetDatavizDefinitionController } from './GetDatavizDefinitionController.js';
import { UpdateDatavizController } from './UpdateDatavizController.js';
import { DeleteDatavizController } from './DeleteDatavizController.js';
import { GetDatavizDataController } from './GetDatavizDataController.js';
import { PublicGetDatavizEmbedController } from './PublicGetDatavizEmbedController.js';
import { DatavizEmbedHtmlController } from './DatavizEmbedHtmlController.js';
import { RefreshDatavizSnapshotController } from './RefreshDatavizSnapshotController.js';
import { PreviewDatavizController } from './PreviewDatavizController.js';

export default (app: Application) => {
  app.get('/embed/dataviz/:id', DatavizEmbedHtmlController.createHandler());

  app.get('/api/dataviz', needsAuthorization(), ListDatavizController.createHandler());
  app.post('/api/dataviz', needsAuthorization(['admin']), CreateDatavizController.createHandler());
  app.get('/api/dataviz/:id', needsAuthorization(), GetDatavizDefinitionController.createHandler());
  app.put('/api/dataviz/:id', needsAuthorization(['admin']), UpdateDatavizController.createHandler());
  app.delete(
    '/api/dataviz/:id',
    needsAuthorization(['admin']),
    DeleteDatavizController.createHandler()
  );
  app.get('/api/dataviz/:id/data', needsAuthorization(), GetDatavizDataController.createHandler());
  app.get(
    '/api/public/dataviz/:id/data',
    PublicGetDatavizEmbedController.createHandler()
  );
  app.post(
    '/api/dataviz/:id/refresh',
    needsAuthorization(['admin']),
    RefreshDatavizSnapshotController.createHandler()
  );
  app.post(
    '/api/dataviz/:id/preview',
    needsAuthorization(['admin']),
    PreviewDatavizController.createHandler()
  );
};
