/* eslint-disable max-statements */
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { propertyTypeIsMultiValued } from '#api/services/informationextraction/ixMaterials.js';
import templates from '#api/templates/index.js';

import { tenants } from '#api/tenants/index.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { IXExtractorType } from '#shared/types/extractorType.js';
import { IXServices } from '#api/services/informationextraction/IXServices.js';
import { ExtractorNotFound, Extractors } from '#api/services/informationextraction/ixextractors.js';
import { BatchRange, calculateBatches, fetchEntitiesDataForBatch } from '#api/suggestions/batchProcessing.js';
import { CreateBlankStateSuggestionsJob } from '#api/suggestions/jobs/CreateBlankStateSuggestionsJob.js';
import { CreateBlankSuggestionStrategy } from '#api/suggestions/useCases/createBlankSuggestionStrategy.js';

// eslint-disable-next-line consistent-return
async function createBlankStateSuggestionsBatch(
  batch: BatchRange,
  templateId: string,
  extractorId: string
) {
  const [entities, extractor] = await Promise.all([
    fetchEntitiesDataForBatch(templateId, batch.fromId, batch.toId),
    Extractors.getById(extractorId),
  ]);

  if (!extractor) {
    throw new ExtractorNotFound(extractorId);
  }

  const targetProperty = await IXServices.getTargetProperty({ extractor });

  const useCase = CreateBlankSuggestionStrategy.getStrategy(extractor);

  await useCase.execute({
    entities,
    extractor,
    targetProperty,
  });
}

const createBlankSuggestionsForPartialExtractor = async (
  extractor: IXExtractorType,
  selectedTemplates: ObjectIdSchema[]
) => {
  const extractorTemplates = new Set(extractor.templates.map(t => t.toString()));
  const sampleProperty = await templates.getPropertyByName(extractor.property);

  const filteredTemplates = selectedTemplates.filter(template =>
    extractorTemplates.has(template.toString())
  );

  const dispatcher = DefaultDispatcher(tenants.current().name, TransactionManagerFactory.default());

  await filteredTemplates.reduce(async (promise, template) => {
    await promise;

    const batches = await calculateBatches(template);

    const isMultiValued = propertyTypeIsMultiValued(sampleProperty.type);
    await batches.reduce(async (prev, batch) => {
      await prev;
      await dispatcher.dispatch(CreateBlankStateSuggestionsJob, {
        batch,
        templateId: template.toString(),
        extractorId: extractor._id.toString(),
        extractorProperty: extractor.property,
        isMultiValued,
        extractorSource: extractor.source,
      });
    }, Promise.resolve());

    return Promise.resolve();
  }, Promise.resolve());
};

const createBlankSuggestionsForExtractor = async (extractor: IXExtractorType) =>
  createBlankSuggestionsForPartialExtractor(extractor, extractor.templates);

export {
  createBlankStateSuggestionsBatch,
  createBlankSuggestionsForExtractor,
  createBlankSuggestionsForPartialExtractor,
};
