import entitiesModel from 'api/entities/entitiesModel';
import { files } from 'api/files';
import { EnforcedWithId } from 'api/odm';
import settings from 'api/settings';
import { tenants } from 'api/tenants';
import { propertyTypeIsMultiValued } from 'api/services/informationextraction/getFiles';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { IXExtractorType } from 'shared/types/extractorType';
import { FileType } from 'shared/types/fileType';
import { IXSuggestionType } from 'shared/types/suggestionType';
import templates from 'api/templates';
import { LanguageUtils } from 'shared/language';
import { Suggestions } from './suggestions';

const fetchEntitiesBatch = async (query: any, limit: number = 100) =>
  entitiesModel.db
    .find(query)
    .select(['sharedId', 'language'])
    .limit(limit)
    .sort({ _id: 1 })
    .lean();

const fetchEntitiesData = async (
  template: ObjectIdSchema,
  defaultLanguage?: string,
  batchSize = 2000
) => {
  const BATCH_SIZE = batchSize;
  let query: any = {
    template,
    ...(defaultLanguage && { language: defaultLanguage }),
  };

  const dataList: { sharedId: string; language: string }[][] = [];

  let fetchedEntities = await fetchEntitiesBatch(query, BATCH_SIZE);

  while (fetchedEntities.length) {
    dataList.push(fetchedEntities.map(e => ({ sharedId: e.sharedId!, language: e.language! })));
    query = {
      ...query,
      _id: { $gt: fetchedEntities[fetchedEntities.length - 1]._id },
      ...(defaultLanguage && {
        language: { $gt: fetchedEntities[fetchedEntities.length - 1].language },
      }),
    };
    // eslint-disable-next-line no-await-in-loop
    fetchedEntities = await fetchEntitiesBatch(query, BATCH_SIZE);
  }

  return dataList.flat();
};

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

const createBlankSuggestionsForPartialExtractor = async (
  extractor: IXExtractorType,
  selectedTemplates: ObjectIdSchema[],
  batchSize?: number
) => {
  const defaultLanguage = (await settings.getDefaultLanguage()).key;
  const extractorTemplates = new Set(extractor.templates.map(t => t.toString()));
  const sampleProperty = await templates.getPropertyByName(extractor.property);

  const templatesPromises = selectedTemplates
    .filter(template => extractorTemplates.has(template.toString()))
    .map(async template => {
      const suggestionsToSave: IXSuggestionType[] = [];

      if (extractor.source.pdf) {
        const entityDataForFiles = await fetchEntitiesData(template, defaultLanguage, batchSize);

        const fetchedFiles = await files.get(
          { entity: { $in: entityDataForFiles.map(entity => entity.sharedId) }, type: 'document' },
          '_id entity language extractedMetadata'
        );

        suggestionsToSave.push(
          ...fetchedFiles
            .filter(file => file.entity)
            .map(file =>
              getBlankSuggestionForPdf({
                file,
                extractorId: extractor._id,
                template,
                propertyName: extractor.property,
                propertyType: sampleProperty.type,
                defaultLanguage,
              })
            )
        );
      } else if (tenants.current().featureFlags?.ixExtraSources && extractor.source.property) {
        const entityData = await fetchEntitiesData(template, undefined, batchSize);

        suggestionsToSave.push(
          ...entityData.map(entity =>
            getBlankSuggestionForProperty({
              entityId: entity.sharedId,
              extractorId: extractor._id,
              template,
              propertyName: extractor.property,
              propertyType: sampleProperty.type,
              language: entity.language,
            })
          )
        );
      }

      await Suggestions.saveMultiple(suggestionsToSave);
    });

  await Promise.all(templatesPromises);
};

const createBlankSuggestionsForExtractor = async (extractor: IXExtractorType, batchSize?: number) =>
  createBlankSuggestionsForPartialExtractor(extractor, extractor.templates, batchSize);

export {
  createBlankSuggestionsForExtractor,
  createBlankSuggestionsForPartialExtractor,
  getBlankSuggestionForPdf,
};
