/* eslint-disable max-statements */
import { EnforcedWithId } from 'api/odm';
import { DefaultDispatcher } from 'api/queue.v2/configuration/factories';
import { propertyTypeIsMultiValued } from 'api/services/informationextraction/ixMaterials';
import templates from 'api/templates';
import { tenants } from 'api/tenants';
import { LanguageUtils } from 'shared/language';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { IXExtractorType } from 'shared/types/extractorType';
import { FileType } from 'shared/types/fileType';
import { IXServices } from 'api/services/informationextraction/IXServices';
import { ExtractorNotFound, Extractors } from 'api/services/informationextraction/ixextractors';
import { BatchRange, calculateBatches, fetchEntitiesDataForBatch } from './batchProcessing';
import { CreateBlankStateSuggestionsJob } from './jobs/CreateBlankStateSuggestionsJob';
import { CreateBlankSuggestionStrategy } from './useCases/createBlankSuggestionStrategy';

const getBlankSuggestionForPdf = ({
  extractorId,
  propertyName,
  template,
  propertyType,
  defaultLanguage,
  file,
}: {
  extractorId: ObjectIdSchema;
  propertyName: string;
  template: ObjectIdSchema;
  propertyType: string;
  defaultLanguage: string;
  file: EnforcedWithId<FileType>;
}) => ({
  language: file.language
    ? LanguageUtils.fromISO639_3(file.language, false)?.ISO639_1 || defaultLanguage
    : defaultLanguage,
  fileId: file._id,
  entityId: file.entity!,
  entityTemplate: template.toString(),
  extractorId,
  propertyName,
  status: 'ready' as 'ready',
  error: '',
  segment: '',
  suggestedValue: propertyTypeIsMultiValued(propertyType) ? [] : '',
  date: new Date().getTime(),
});

// eslint-disable-next-line consistent-return
async function createBlankStateSuggestionsBatch(
  batch: BatchRange,
  templateId: string,
  extractorId: string,
  isMultiValued: boolean
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
    templateId,
    isMultiValued,
    extractor,
    targetProperty,
  });
}

const getBlankSuggestionForProperty = ({
  entityId,
  extractorId,
  propertyName,
  propertyType,
  template,
  language,
}: {
  entityId: string;
  extractorId: ObjectIdSchema;
  propertyName: string;
  propertyType: string;
  template: ObjectIdSchema;
  language: string;
}) => ({
  language,
  entityId,
  entityTemplate: template.toString(),
  extractorId,
  propertyName,
  status: 'ready' as 'ready',
  error: '',
  segment: '',
  suggestedValue: propertyTypeIsMultiValued(propertyType) ? [] : '',
  date: new Date().getTime(),
});

const createBlankSuggestionsForPartialExtractor = async (
  extractor: IXExtractorType,
  selectedTemplates: ObjectIdSchema[]
) => {
  const extractorTemplates = new Set(extractor.templates.map(t => t.toString()));
  const sampleProperty = await templates.getPropertyByName(extractor.property);

  const filteredTemplates = selectedTemplates.filter(template =>
    extractorTemplates.has(template.toString())
  );

  const dispatcher = await DefaultDispatcher(tenants.current().name);

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
  getBlankSuggestionForPdf,
  getBlankSuggestionForProperty,
};
