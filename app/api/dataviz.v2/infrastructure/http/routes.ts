import { Application } from 'express';
import needsAuthorization from '#api/auth/authMiddleware.js';
import { featureFlagEnabled } from '#api/utils/featureFlagEnabledMiddleware.js';
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
  app.get(
    '/embed/dataviz/:id',
    featureFlagEnabled('dataViz'),
    DatavizEmbedHtmlController.createHandler()
  );

  app.get(
    '/api/dataviz',
    needsAuthorization(),
    featureFlagEnabled('dataViz'),
    ListDatavizController.createHandler()
  );
  app.post(
    '/api/dataviz',
    needsAuthorization(['admin']),
    featureFlagEnabled('dataViz'),
    CreateDatavizController.createHandler()
  );
  app.get(
    '/api/dataviz/:id',
    needsAuthorization(),
    featureFlagEnabled('dataViz'),
    GetDatavizDefinitionController.createHandler()
  );
  app.put(
    '/api/dataviz/:id',
    needsAuthorization(['admin']),
    featureFlagEnabled('dataViz'),
    UpdateDatavizController.createHandler()
  );
  app.delete(
    '/api/dataviz/:id',
    needsAuthorization(['admin']),
    featureFlagEnabled('dataViz'),
    DeleteDatavizController.createHandler()
  );
  app.get(
    '/api/dataviz/:id/data',
    needsAuthorization(),
    featureFlagEnabled('dataViz'),
    GetDatavizDataController.createHandler()
  );
  app.get(
    '/api/public/dataviz/:id/data',
    featureFlagEnabled('dataViz'),
    PublicGetDatavizEmbedController.createHandler()
  );
  app.post(
    '/api/dataviz/:id/refresh',
    needsAuthorization(['admin']),
    featureFlagEnabled('dataViz'),
    RefreshDatavizSnapshotController.createHandler()
  );
  app.post(
    '/api/dataviz/:id/preview',
    needsAuthorization(['admin']),
    featureFlagEnabled('dataViz'),
    PreviewDatavizController.createHandler()
  );
};
