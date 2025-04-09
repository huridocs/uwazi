import { Application } from 'express';

import { needsAuthorization } from 'api/auth';
import { featureFlagEnabled } from 'api/utils/featureFlagEnabledMiddleware';

import { parseBody } from 'api/utils/parseBodyMiddleware';
import { PXCreateExtractorController } from './PXCreateExtractorController';
import { PXDeleteExtractorController } from './PXDeleteExtractorController';
import { PXExtractParagraphFromEntitiesController } from './PXExtractParagraphFromEntitiesController';
import { PXExtractParagraphsByEntityStatusController } from './PXExtractParagraphsByEntityStatusController';
import { PXGetEntityParagraphsController } from './PXGetEntityParagraphsController';
import { PXGetExtractorsController } from './PXGetExtractorsController';
import { PXGetExtractorStatusesController } from './PXGetExtractorStatusesController';

const paragraphExtractionRoutes = (app: Application) => {
  app.post(
    '/api/paragraphExtraction/extractor',
    needsAuthorization(['admin', 'editor']),
    parseBody(),
    featureFlagEnabled('paragraphExtraction'),
    PXCreateExtractorController.adapt(PXCreateExtractorController)
  );

  app.delete(
    '/api/paragraphExtraction/extractor',
    needsAuthorization(['admin', 'editor']),
    featureFlagEnabled('paragraphExtraction'),
    PXDeleteExtractorController.adapt(PXDeleteExtractorController)
  );

  app.post(
    '/api/paragraphExtraction/extract',
    featureFlagEnabled('paragraphExtraction'),
    needsAuthorization(['admin', 'editor']),
    parseBody(),
    PXExtractParagraphFromEntitiesController.adapt(PXExtractParagraphFromEntitiesController)
  );

  app.post(
    '/api/paragraphExtraction/extractNew',
    featureFlagEnabled('paragraphExtraction'),
    needsAuthorization(['admin', 'editor']),
    parseBody(),
    PXExtractParagraphsByEntityStatusController.adapt(PXExtractParagraphsByEntityStatusController)
  );

  app.get(
    '/api/paragraphExtraction/extractors',
    featureFlagEnabled('paragraphExtraction'),
    needsAuthorization(['admin', 'editor']),
    PXGetExtractorsController.adapt(PXGetExtractorsController)
  );

  app.get(
    '/api/paragraphExtraction/extractorStatuses',
    featureFlagEnabled('paragraphExtraction'),
    needsAuthorization(['admin', 'editor']),
    PXGetExtractorStatusesController.adapt(PXGetExtractorStatusesController)
  );

  app.get(
    '/api/paragraphExtraction/entityParagraphs',
    featureFlagEnabled('paragraphExtraction'),
    needsAuthorization(['admin', 'editor']),
    PXGetEntityParagraphsController.adapt(PXGetEntityParagraphsController)
  );
};

export { paragraphExtractionRoutes };
