import { Application } from 'express';

import { needsAuthorization } from '#api/auth/index.js';

import { featureFlagEnabled } from '#api/utils/featureFlagEnabledMiddleware.js';

import { PXCreateExtractorController } from '#api/paragraphExtraction/adapters/PXCreateExtractorController.js';
import { PXExtractParagraphFromEntitiesController } from '#api/paragraphExtraction/adapters/PXExtractParagraphFromEntitiesController.js';
import { PXGetExtractorsController } from '#api/paragraphExtraction/adapters/PXGetExtractorsController.js';
import { PXGetExtractorStatusesController } from '#api/paragraphExtraction/adapters/PXGetExtractorStatusesController.js';
import { PXGetEntityParagraphsController } from '#api/paragraphExtraction/adapters/PXGetEntityParagraphsController.js';
import { PXExtractParagraphsByEntityStatusController } from '#api/paragraphExtraction/adapters/PXExtractParagraphsByEntityStatusController.js';
import { PXDeleteExtractorController } from '#api/paragraphExtraction/adapters/PXDeleteExtractorController.js';

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
