import { Application } from 'express';

import { PXCreateExtractorController } from './PXCreateExtractorController';
import { PXCreateExtractorFactory } from '../infrastructure/PXCreateExtractorFactory';
import { PXExtractParagraphFromEntitiesController } from './PXExtractParagraphFromEntitiesController';
import { PXExtractParagraphsFromEntitiesFactory } from '../infrastructure/PXExtractParagraphsFromEntitiesFactory';
import { PXGetExtractorsController } from './PXGetExtractorsController';
import { PXExtractorsQueryServiceFactory } from '../infrastructure/PXExtractorsQueryServiceFactory';

const paragraphExtractionRoutes = (app: Application) => {
  app.post('/api/paragraphExtraction/extractor', async (request, response) =>
    new PXCreateExtractorController({
      response,
      request,
      createExtractor: PXCreateExtractorFactory.createDefault(),
    }).handle()
  );

  app.post('/api/paragraphExtraction/extract', async (request, response) =>
    new PXExtractParagraphFromEntitiesController({
      response,
      request,
      extractParagraphFromEntities: PXExtractParagraphsFromEntitiesFactory.createDefault(),
    }).handle()
  );

  app.get('/api/paragraphExtraction/extractors', async (request, response) =>
    new PXGetExtractorsController({
      response,
      request,
      extractorsQueryService: PXExtractorsQueryServiceFactory.createDefault(),
    }).handle()
  );
};

export { paragraphExtractionRoutes };
