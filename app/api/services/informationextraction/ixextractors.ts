import { ObjectId } from 'mongodb';

import entitiesModel from 'api/entities/entitiesModel';
import { files } from 'api/files/files';
import settings from 'api/settings';
import { Suggestions } from 'api/suggestions/suggestions';
import templates from 'api/templates';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { IXExtractorType } from 'shared/types/extractorType';
import { FileType } from 'shared/types/fileType';
import { IXSuggestionType } from 'shared/types/suggestionType';
import { IXExtractorModel as model } from './IXExtractorModel';
import languages from 'shared/languages';

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

const createBlankSuggestionsForExtractor = async (
  extractor: IXExtractorType,
  batchSize?: number
) => {
  const { templates: extractorTemplates } = extractor;
  const defaultLanguage = (await settings.getDefaultLanguage()).key;

  const templatesPromises = extractorTemplates.map(async template => {
    const entitiesSharedIds = await fetchEntitiesSharedIds(template, defaultLanguage, batchSize);

    const fetchedFiles = await files.get(
      { entity: { $in: entitiesSharedIds }, type: 'document' },
      '_id entity language extractedMetadata'
    );

    const suggestionsToSave: IXSuggestionType[] = fetchedFiles
      .filter(file => file.entity)
      .map(file => {
        const language = file.language
          ? languages.get(file.language, 'ISO639_1') || defaultLanguage
          : defaultLanguage;
        return {
          language,
          fileId: file._id,
          entityId: file.entity!,
          entityTemplate: typeof template === 'string' ? template : template.toString(),
          extractorId: extractor._id,
          propertyName: extractor.property,
          status: 'ready',
          error: '',
          segment: '',
          suggestedValue: '',
          date: new Date().getTime(),
        };
      });
    await Suggestions.saveMultiple(suggestionsToSave);
  });

  await Promise.all(templatesPromises);
};

export default {
  get: model.get.bind(model),
  get_all: async () => model.get({}),
  delete: async (_ids: string[]) => {
    const ids = _ids.map(id => new ObjectId(id));
    const extractors = await model.get({ _id: { $in: ids } });
    if (extractors.length !== ids.length) throw new Error('Missing extractor.');
    await model.delete({ _id: { $in: ids } });
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
