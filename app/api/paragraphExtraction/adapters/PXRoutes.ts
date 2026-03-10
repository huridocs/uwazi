import { Application } from 'express';

import { needsAuthorization } from 'api/auth';
import { featureFlagEnabled } from 'api/utils/featureFlagEnabledMiddleware';

import { PXCreateExtractorController } from './PXCreateExtractorController';
import { PXExtractParagraphFromEntitiesController } from './PXExtractParagraphFromEntitiesController';
import { PXGetExtractorsController } from './PXGetExtractorsController';
import { PXGetExtractorStatusesController } from './PXGetExtractorStatusesController';
import { PXGetEntityParagraphsController } from './PXGetEntityParagraphsController';
import { PXExtractParagraphsByEntityStatusController } from './PXExtractParagraphsByEntityStatusController';
import { PXDeleteExtractorController } from './PXDeleteExtractorController';

const paragraphExtractionRoutes = (app: Application) => {
  app.post(
    '/api/paragraphExtraction/extractor',
    needsAuthorization(['admin', 'editor']),
    featureFlagEnabled('paragraphExtraction'),
    PXCreateExtractorController.createHandler()
  );

  app.delete(
    '/api/paragraphExtraction/extractor',
    needsAuthorization(['admin', 'editor']),
    featureFlagEnabled('paragraphExtraction'),
    PXDeleteExtractorController.createHandler()
  );

  app.post(
    '/api/paragraphExtraction/extract',
    needsAuthorization(['admin', 'editor']),
    featureFlagEnabled('paragraphExtraction'),
    PXExtractParagraphFromEntitiesController.createHandler()
  );

  app.post(
    '/api/paragraphExtraction/extractNew',
    needsAuthorization(['admin', 'editor']),
    featureFlagEnabled('paragraphExtraction'),
    PXExtractParagraphsByEntityStatusController.createHandler()
  );

  app.get(
    '/api/paragraphExtraction/extractors',
    needsAuthorization(['admin', 'editor']),
    featureFlagEnabled('paragraphExtraction'),
    PXGetExtractorsController.createHandler()
  );

  app.get(
    '/api/paragraphExtraction/extractorStatuses',
    needsAuthorization(['admin', 'editor']),
    featureFlagEnabled('paragraphExtraction'),
    PXGetExtractorStatusesController.createHandler()
  );

  app.get(
    '/api/paragraphExtraction/entityParagraphs',
    needsAuthorization(['admin', 'editor']),
    featureFlagEnabled('paragraphExtraction'),
    PXGetEntityParagraphsController.createHandler()
  );
};

export { paragraphExtractionRoutes };
