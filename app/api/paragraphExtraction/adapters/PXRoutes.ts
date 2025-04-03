import { Application } from 'express';

import { needsAuthorization } from 'api/auth';

import { PXCreateExtractorController } from './PXCreateExtractorController';
import { PXExtractParagraphFromEntitiesController } from './PXExtractParagraphFromEntitiesController';
import { PXGetExtractorsController } from './PXGetExtractorsController';
import { PXGetExtractorStatusesController } from './PXGetExtractorStatusesController';
import { PXGetEntityParagraphsController } from './PXGetEntityParagraphsController';
import { PXDeleteExtractorController } from './PXDeleteExtractorController';

const paragraphExtractionRoutes = (app: Application) => {
  app.post(
    '/api/paragraphExtraction/extractor',
    needsAuthorization(['admin', 'editor']),
    PXCreateExtractorController.adapt(PXCreateExtractorController)
  );

  app.delete(
    '/api/paragraphExtraction/extractor',
    needsAuthorization(['admin', 'editor']),
    PXDeleteExtractorController.adapt(PXDeleteExtractorController)
  );

  app.post(
    '/api/paragraphExtraction/extract',
    needsAuthorization(['admin', 'editor']),
    PXExtractParagraphFromEntitiesController.adapt(PXExtractParagraphFromEntitiesController)
  );

  app.get(
    '/api/paragraphExtraction/extractors',
    needsAuthorization(['admin', 'editor']),
    PXGetExtractorsController.adapt(PXGetExtractorsController)
  );

  app.get(
    '/api/paragraphExtraction/extractorStatuses',
    needsAuthorization(['admin', 'editor']),
    PXGetExtractorStatusesController.adapt(PXGetExtractorStatusesController)
  );

  app.get(
    '/api/paragraphExtraction/entityParagraphs',
    needsAuthorization(['admin', 'editor']),
    PXGetEntityParagraphsController.adapt(PXGetEntityParagraphsController)
  );
};

export { paragraphExtractionRoutes };
