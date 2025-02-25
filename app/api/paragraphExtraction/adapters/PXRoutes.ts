import { Application } from 'express';

import { needsAuthorization } from 'api/auth';

import { PXCreateExtractorController } from './PXCreateExtractorController';
import { PXExtractParagraphFromEntitiesController } from './PXExtractParagraphFromEntitiesController';
import { PXGetExtractorsController } from './PXGetExtractorsController';

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
};

export { paragraphExtractionRoutes };
