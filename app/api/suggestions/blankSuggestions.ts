/* eslint-disable max-statements */
import { files } from 'api/files';
import { EnforcedWithId } from 'api/odm';
import { DefaultDispatcher } from 'api/queue.v2/configuration/factories';
import { propertyTypeIsMultiValued } from 'api/services/informationextraction/getFiles';
import settings from 'api/settings';
import templates from 'api/templates';
import { tenants } from 'api/tenants';
import { ObjectId } from 'mongodb';
import { LanguageUtils } from 'shared/language';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { IXExtractorType } from 'shared/types/extractorType';
import { FileType } from 'shared/types/fileType';
import { getSuggestionState } from 'shared/getIXSuggestionState';
import { IXServices } from 'api/services/informationextraction/IXServices';
import { ExtractorNotFound, Extractors } from 'api/services/informationextraction/ixextractors';
import {
  BatchRange,
  calculateBatches,
  fetchEntitiesDataForBatch,
  getDefaultEntity,
} from './batchProcessing';
import { CreateBlankStateSuggestionsJob } from './jobs/CreateBlankStateSuggestionsJob';
import { Suggestions } from './suggestions';

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
  extractorProperty: string,
  isMultiValued: boolean,
  extractorSource: {
    pdf?: boolean;
    property?: string;
  }
) {
  const defaultLanguage = (await settings.getDefaultLanguage()).key;
  const extractor = await Extractors.getById(extractorId);
  if (!extractor) {
    throw new ExtractorNotFound(extractorId);
  }

  const targetProperty = await IXServices.getTargetProperty({ extractor });

  if (extractorSource.pdf) {
    const batchData = await fetchEntitiesDataForBatch(templateId, batch.fromId, batch.toId);
    const fetchedFiles = await files.get(
      {
        entity: { $in: batchData.map(entity => entity.sharedId) },
        type: 'document',
      },
      '_id entity language extractedMetadata'
    );

    const batchSuggestions = await Promise.all(
      fetchedFiles
        .filter(file => file.entity)
        .map(async file => {
          const blank = {
            language:
              LanguageUtils.fromISO639_3(file.language as string, false)?.ISO639_1 ||
              defaultLanguage,
            fileId: file._id,
            entityId: file.entity!,
            entityTemplate: templateId,
            extractorId: ObjectId.createFromHexString(extractorId),
            propertyName: extractorProperty,
            status: 'ready' as 'ready',
            error: '',
            segment: '',
            suggestedValue: isMultiValued ? [] : '',
            date: new Date().getTime(),
          };

          let entity = batchData.find(
            e => e.language === blank.language && e.sharedId === file.entity
          );

          if (!entity) {
            entity = await getDefaultEntity(blank.entityId, defaultLanguage);
          }

          const state = getSuggestionState(
            {
              date: blank.date,
              error: blank.error,
              status: blank.status,
              segment: blank.segment,
              suggestedValue: blank.suggestedValue,
              currentValue: IXServices.extractCurrentValue({
                entity,
                targetProperty,
              }),
              labeledValue: IXServices.extractLabeledValueFromFile({ file, targetProperty }),
              modelCreationDate: undefined as any,
              state: undefined as any,
            },
            targetProperty.type
          );

          return { ...blank, state };
        })
    );

    return Suggestions.createMultiple(batchSuggestions);
  }
  const batchData = await fetchEntitiesDataForBatch(templateId, batch.fromId, batch.toId);

  if (extractorSource.property) {
    const batchSuggestions = batchData.map(entity => {
      const blank = {
        language: entity.language,
        entityId: entity.sharedId,
        entityTemplate: templateId,
        extractorId: new ObjectId(extractorId),
        propertyName: extractorProperty,
        status: 'ready' as 'ready',
        error: '',
        segment: '',
        suggestedValue: isMultiValued ? [] : '',
        date: new Date().getTime(),
      };

      const currentValue = IXServices.extractCurrentValue({ entity, targetProperty });
      const labeledValue = IXServices.extractLabeledValueFromEntity({ entity, targetProperty });

      const state = getSuggestionState(
        {
          date: blank.date,
          error: blank.error,
          status: blank.status,
          suggestedValue: blank.suggestedValue,
          segment: blank.segment,
          currentValue,
          labeledValue,
          modelCreationDate: undefined as any,
          state: undefined as any,
        },
        targetProperty.type
      );

      return { ...blank, state };
    });

    await Suggestions.createMultiple(batchSuggestions);
  }
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

    console.log('batches', batches);
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
