import { ObjectId } from 'mongodb';

import entitiesModel from 'api/entities/entitiesModel';
import { files } from 'api/files/files';
import { EnforcedWithId } from 'api/odm';
import settings from 'api/settings';
import { Suggestions } from 'api/suggestions/suggestions';
import templates from 'api/templates';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { IXExtractorType } from 'shared/types/extractorType';
import { FileType } from 'shared/types/fileType';
import { IXSuggestionType } from 'shared/types/suggestionType';
import languages from 'shared/languages';
import { IXExtractorModel as model } from './IXExtractorModel';

const templatePropertyExistenceCheck = async (property: string, templateIds: string[]) => {
  const usedTemplates = objectIndex(
    await templates.get({ _id: { $in: templateIds } }),
    t => t._id.toString(),
    t => t
  );
  templateIds.forEach(id => {
    if (!(id in usedTemplates)) {
      throw Error('Missing template.');
    }
  });

  const propertyMap = Object.fromEntries(
    Object.entries(usedTemplates).map(([tId, t]) => [
      tId,
      new Set(t.properties?.map(p => p.name) || []),
    ])
  );
  templateIds.forEach(id => {
    if (property !== 'title' && !propertyMap[id].has(property)) {
      throw Error('Missing property.');
    }
  });
};

const fetchEntitiesBatch = async (query: any, limit: number = 100) =>
  entitiesModel.db.find(query).select('sharedId').limit(limit).sort({ _id: 1 });

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

const getBlankSuggestion = (
  file: EnforcedWithId<FileType>,
  { _id: extractorId, property: propertyName }: { _id: ObjectIdSchema; property: string },
  template: ObjectIdSchema,
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
  suggestedValue: '',
  date: new Date().getTime(),
});

const createBlankSuggestionsForPartialExtractor = async (
  extractor: IXExtractorType,
  selectedTemplates: ObjectIdSchema[],
  batchSize?: number
) => {
  const defaultLanguage = (await settings.getDefaultLanguage()).key;
  const extractorTemplates = new Set(extractor.templates.map(t => t.toString()));

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
        .map(file => getBlankSuggestion(file, extractor, template, defaultLanguage));
      await Suggestions.saveMultiple(suggestionsToSave);
    });

  await Promise.all(templatesPromises);
};

const createBlankSuggestionsForExtractor = async (extractor: IXExtractorType, batchSize?: number) =>
  createBlankSuggestionsForPartialExtractor(extractor, extractor.templates, batchSize);

const handlePropertyUpdate = async (updatedExtractor: IXExtractorType) => {
  await Suggestions.delete({ extractorId: updatedExtractor._id });
  await createBlankSuggestionsForExtractor(updatedExtractor);
};

const handleTemplateUpdate = async (
  oldExtractor: IXExtractorType,
  newExtractor: IXExtractorType
) => {
  const templatesRemoved = oldExtractor.templates
    .filter(templateId => !newExtractor.templates.includes(templateId.toString()))
    .map(templateId => templateId.toString());

  const templatesAdded = newExtractor.templates.filter(
    templateId => !oldExtractor.templates.find(template => template.toString() === templateId)
  );

  await Suggestions.delete({
    entityTemplate: { $in: templatesRemoved },
    extractorId: oldExtractor._id,
  });

  if (templatesAdded.length) {
    await createBlankSuggestionsForPartialExtractor(newExtractor, templatesAdded);
  }
};

const Extractors = {
  get: model.get.bind(model),
  get_all: async () => model.get({}),
  delete: async (_ids: string[]) => {
    const ids = _ids.map(id => new ObjectId(id));
    const extractors = await model.get({ _id: { $in: ids } });
    if (extractors.length !== ids.length) throw new Error('Missing extractor.');
    await model.delete({ _id: { $in: ids } });
    await Suggestions.delete({ extractorId: { $in: ids } });
  },
  create: async (name: string, property: string, templateIds: string[]) => {
    await templatePropertyExistenceCheck(property, templateIds);
    const saved = await model.save({
      name,
      property,
      templates: templateIds,
    });
    await createBlankSuggestionsForExtractor(saved);
    return saved;
  },
  update: async (id: string, name: string, property: string, templateIds: string[]) => {
    const [extractor] = await model.get({ _id: new ObjectId(id) });
    if (!extractor) throw Error('Missing extractor.');
    await templatePropertyExistenceCheck(property, templateIds);

    const updated = await model.save({
      ...extractor,
      name,
      property,
      templates: templateIds,
    });

    if (property !== extractor.property) {
      await handlePropertyUpdate(updated);
    } else {
      await handleTemplateUpdate(extractor, updated);
    }

    return updated;
  },

  cleanupTemplateFromPropertyExtractors: async (
    templateId: string,
    propertyNamesToKeep: string[]
  ) => {
    const extractorsToUpdate = await model.get({
      templates: templateId,
      property: { $nin: propertyNamesToKeep },
    });

    const extractorIds = extractorsToUpdate.map(extractor => extractor._id);

    await model.updateMany({ _id: { $in: extractorIds } }, { $pull: { templates: templateId } });

    await Suggestions.delete({ entityTemplate: templateId, extractorId: { $in: extractorIds } });
  },
};

export default Extractors;
