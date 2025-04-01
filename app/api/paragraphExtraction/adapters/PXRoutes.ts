import { Application } from 'express';

import { needsAuthorization } from 'api/auth';

import { PXCreateExtractorController } from './PXCreateExtractorController';
import { PXExtractParagraphFromEntitiesController } from './PXExtractParagraphFromEntitiesController';
import { PXGetExtractorsController } from './PXGetExtractorsController';
import { PXGetExtractorStatusesController } from './PXGetExtractorStatusesController';

const paragraphExtractionRoutes = (app: Application) => {
  app.post(
    '/api/paragraphExtraction/extractor',
    needsAuthorization(),
    PXCreateExtractorController.adapt(PXCreateExtractorController)
  );

  app.post(
    '/api/paragraphExtraction/extract',
    needsAuthorization(),
    PXExtractParagraphFromEntitiesController.adapt(PXExtractParagraphFromEntitiesController)
  );

  app.get(
    '/api/paragraphExtraction/extractors',
    needsAuthorization(),
    PXGetExtractorsController.adapt(PXGetExtractorsController)
  );

  app.get(
    '/api/paragraphExtraction/extractorStatuses',
    needsAuthorization(['admin', 'editor']),
    PXGetExtractorStatusesController.adapt(PXGetExtractorStatusesController)
  );
};

export { paragraphExtractionRoutes };
