import entitiesModel from 'api/entities/entitiesModel';
import { files } from 'api/files';
import { EnforcedWithId } from 'api/odm';
import settings from 'api/settings';
import { propertyTypeIsMultiValued } from 'api/services/informationextraction/getFiles';
import languages from 'shared/languages';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { IXExtractorType } from 'shared/types/extractorType';
import { FileType } from 'shared/types/fileType';
import { IXSuggestionType } from 'shared/types/suggestionType';
import { Suggestions } from './suggestions';
import templates from 'api/templates';

const fetchEntitiesBatch = async (query: any, limit: number = 100) =>
  entitiesModel.db.find(query).select('sharedId').limit(limit).sort({ _id: 1 }).lean();

const fetchEntitiesSharedIds = async (
  template: ObjectIdSchema,
  defaultLanguage: string,
  batchSize = 2000
) => {
  const BATCH_SIZE = batchSize;
  let query: any = {
    template,
    language: defaultLanguage,
  };

  const sharedIdLists: string[][] = [];

  let fetchedEntities = await fetchEntitiesBatch(query, BATCH_SIZE);
  while (fetchedEntities.length) {
    sharedIdLists.push(fetchedEntities.map(e => e.sharedId!));
    query = {
      ...query,
      _id: { $gt: fetchedEntities[fetchedEntities.length - 1]._id },
    };
    // eslint-disable-next-line no-await-in-loop
    fetchedEntities = await fetchEntitiesBatch(query, BATCH_SIZE);
  }

  return sharedIdLists.flat();
};

export const getBlankSuggestion = (
  file: EnforcedWithId<FileType>,
  { _id: extractorId, property: propertyName }: { _id: ObjectIdSchema; property: string },
  template: ObjectIdSchema,
  propertyType: string,
  defaultLanguage: string
) => ({
  language: file.language
    ? languages.get(file.language, 'ISO639_1') || defaultLanguage
    : defaultLanguage,
  fileId: file._id,
  entityId: file.entity!,
  entityTemplate: typeof template === 'string' ? template : template.toString(),
  extractorId,
  propertyName,
  status: 'ready' as 'ready',
  error: '',
  segment: '',
  suggestedValue: propertyTypeIsMultiValued(propertyType) ? [] : '',
  date: new Date().getTime(),
});

export const createBlankSuggestionsForPartialExtractor = async (
  extractor: IXExtractorType,
  selectedTemplates: ObjectIdSchema[],
  batchSize?: number
) => {
  const defaultLanguage = (await settings.getDefaultLanguage()).key;
  const extractorTemplates = new Set(extractor.templates.map(t => t.toString()));
  const exampleProperty = await templates.getPropertyByName(extractor.property);

  const templatesPromises = selectedTemplates
    .filter(template => extractorTemplates.has(template.toString()))
    .map(async template => {
      const entitiesSharedIds = await fetchEntitiesSharedIds(template, defaultLanguage, batchSize);

      const fetchedFiles = await files.get(
        { entity: { $in: entitiesSharedIds }, type: 'document' },
        '_id entity language extractedMetadata'
      );

      const suggestionsToSave: IXSuggestionType[] = fetchedFiles
        .filter(file => file.entity)
        .map(file =>
          getBlankSuggestion(file, extractor, template, exampleProperty.type, defaultLanguage)
        );
      await Suggestions.saveMultiple(suggestionsToSave);
    });

  await Promise.all(templatesPromises);
};

export const createBlankSuggestionsForExtractor = async (
  extractor: IXExtractorType,
  batchSize?: number
) => createBlankSuggestionsForPartialExtractor(extractor, extractor.templates, batchSize);
