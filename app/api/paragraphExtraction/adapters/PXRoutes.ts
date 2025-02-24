import { Application } from 'express';

import { needsAuthorization } from 'api/auth';

import { PXCreateExtractorController } from './PXCreateExtractorController';
import { PXCreateExtractorFactory } from '../infrastructure/PXCreateExtractorFactory';
import { PXExtractParagraphFromEntitiesController } from './PXExtractParagraphFromEntitiesController';
import { PXExtractParagraphsFromEntitiesFactory } from '../infrastructure/PXExtractParagraphsFromEntitiesFactory';
import { PXGetExtractorsController } from './PXGetExtractorsController';
import { PXExtractorsQueryServiceFactory } from '../infrastructure/PXExtractorsQueryServiceFactory';

const paragraphExtractionRoutes = (app: Application) => {
  app.post('/api/paragraphExtraction/extractor', needsAuthorization(), async (request, response) =>
    new PXCreateExtractorController({
      response,
      request,
      createExtractor: PXCreateExtractorFactory.createDefault(),
    }).handleAsync()
  );

  app.post('/api/paragraphExtraction/extract', needsAuthorization(), async (request, response) =>
    new PXExtractParagraphFromEntitiesController({
      response,
      request,
      extractParagraphFromEntities: PXExtractParagraphsFromEntitiesFactory.createDefault(),
    }).handleAsync()
  );

  app.get('/api/paragraphExtraction/extractors', needsAuthorization(), async (request, response) =>
    new PXGetExtractorsController({
      response,
      request,
      extractorsQueryService: PXExtractorsQueryServiceFactory.createDefault(),
    }).handleAsync()
  );
};

export { paragraphExtractionRoutes };
