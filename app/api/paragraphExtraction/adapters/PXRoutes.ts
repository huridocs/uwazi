import { Application } from 'express';

// @ts-expect-error TS(2307): Cannot find module '../auth.js' or its correspondi... Remove this comment to see the full error message
import { needsAuthorization } from '../auth.js';
// @ts-expect-error TS(2307): Cannot find module '../utils/featureFlagEnabledMid... Remove this comment to see the full error message
import { featureFlagEnabled } from '../utils/featureFlagEnabledMiddleware.js';

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
    // @ts-expect-error TS(2339): Property 'createHandler' does not exist on type 't... Remove this comment to see the full error message
    PXCreateExtractorController.createHandler()
  );

  app.delete(
    '/api/paragraphExtraction/extractor',
    needsAuthorization(['admin', 'editor']),
    featureFlagEnabled('paragraphExtraction'),
    // @ts-expect-error TS(2339): Property 'createHandler' does not exist on type 't... Remove this comment to see the full error message
    PXDeleteExtractorController.createHandler()
  );

  app.post(
    '/api/paragraphExtraction/extract',
    needsAuthorization(['admin', 'editor']),
    featureFlagEnabled('paragraphExtraction'),
    // @ts-expect-error TS(2339): Property 'createHandler' does not exist on type 't... Remove this comment to see the full error message
    PXExtractParagraphFromEntitiesController.createHandler()
  );

  app.post(
    '/api/paragraphExtraction/extractNew',
    needsAuthorization(['admin', 'editor']),
    featureFlagEnabled('paragraphExtraction'),
    // @ts-expect-error TS(2339): Property 'createHandler' does not exist on type 't... Remove this comment to see the full error message
    PXExtractParagraphsByEntityStatusController.createHandler()
  );

  app.get(
    '/api/paragraphExtraction/extractors',
    needsAuthorization(['admin', 'editor']),
    featureFlagEnabled('paragraphExtraction'),
    // @ts-expect-error TS(2339): Property 'createHandler' does not exist on type 't... Remove this comment to see the full error message
    PXGetExtractorsController.createHandler()
  );

  app.get(
    '/api/paragraphExtraction/extractorStatuses',
    needsAuthorization(['admin', 'editor']),
    featureFlagEnabled('paragraphExtraction'),
    // @ts-expect-error TS(2339): Property 'createHandler' does not exist on type 't... Remove this comment to see the full error message
    PXGetExtractorStatusesController.createHandler()
  );

  app.get(
    '/api/paragraphExtraction/entityParagraphs',
    needsAuthorization(['admin', 'editor']),
    featureFlagEnabled('paragraphExtraction'),
    // @ts-expect-error TS(2339): Property 'createHandler' does not exist on type 't... Remove this comment to see the full error message
    PXGetEntityParagraphsController.createHandler()
  );
};

export { paragraphExtractionRoutes };
