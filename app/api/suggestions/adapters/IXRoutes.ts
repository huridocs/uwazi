import { needsAuthorization } from 'api/auth';
import { Application } from 'express';
import { IXSaveLabeledDataController } from './IXSaveLabeledDataController';

const informationExtractionRoutes = (app: Application) => {
  app.post(
    '/api/informationExtraction/labeledData',
    needsAuthorization(['admin', 'editor']),
    IXSaveLabeledDataController.adapt(IXSaveLabeledDataController)
  );
};

export { informationExtractionRoutes };
