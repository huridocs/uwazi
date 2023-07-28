/* eslint-disable max-lines */
import { ObjectId } from 'mongodb';
import { FilterQuery } from 'mongoose';

import entities from 'api/entities/entities';
import { files } from 'api/files/files';
import { EnforcedWithId } from 'api/odm';
import settings from 'api/settings/settings';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import templates from 'api/templates';
import { syncedPromiseLoop } from 'shared/data_utils/promiseUtils';
import {
  ExtractedMetadataSchema,
  LanguagesListSchema,
  ObjectIdSchema,
} from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';
import {
  IXSuggestionsFilter,
  IXSuggestionType,
  SuggestionCustomFilter,
} from 'shared/types/suggestionType';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { getSegmentedFilesIds } from 'api/services/informationextraction/getFiles';
import { registerEventListeners } from './eventListeners';
import {
  getCurrentValueStage,
  getEntityStage,
  getFileStage,
  getLabeledValueStage,
  getMatchStage,
} from './pipelineStages';
import { updateStates } from './updateState';

interface AcceptedSuggestion {
  _id: ObjectIdSchema;
  sharedId: string;
  entityId: string;
}

const updateEntitiesWithSuggestion = async (
  allLanguages: boolean,
  acceptedSuggestions: AcceptedSuggestion[],
  suggestions: IXSuggestionType[]
) => {
  const sharedIds = acceptedSuggestions.map(s => s.sharedId);
  const entityIds = acceptedSuggestions.map(s => s.entityId);
  const { propertyName } = suggestions[0];
  const query = allLanguages
    ? { sharedId: { $in: sharedIds } }
    : { sharedId: { $in: sharedIds }, _id: { $in: entityIds } };
  const storedEntities = await entities.get(query, '+permissions');

  const acceptedSuggestionsBySharedId = objectIndex(
    acceptedSuggestions,
    as => as.sharedId,
    as => as
  );
  const suggestionsById = objectIndex(
    suggestions,
    s => s._id?.toString() || '',
    s => s
  );

  const getValue = (entity: EntitySchema) =>
    suggestionsById[acceptedSuggestionsBySharedId[entity.sharedId?.toString() || '']._id.toString()]
      .suggestedValue;

  const entitiesToUpdate =
    propertyName !== 'title'
      ? storedEntities.map((entity: EntitySchema) => ({
          ...entity,
          metadata: {
            ...entity.metadata,
            [propertyName]: [
              {
                value: getValue(entity),
              },
            ],
          },
          permissions: entity.permissions || [],
        }))
      : storedEntities.map((entity: EntitySchema) => ({
          ...entity,
          title: getValue(entity),
        }));

  await entities.saveMultiple(entitiesToUpdate);
};

const updateExtractedMetadata = async (suggestions: IXSuggestionType[]) => {
  const fetchedFiles = await files.get({ _id: { $in: suggestions.map(s => s.fileId) } });
  const suggestionsByFileId = objectIndex(
    suggestions,
    s => s.fileId?.toString() || '',
    s => s
  );

  await syncedPromiseLoop(fetchedFiles, async (file: EnforcedWithId<FileType>) => {
    const suggestion = suggestionsByFileId[file._id.toString()];
    file.extractedMetadata = file.extractedMetadata ? file.extractedMetadata : [];

    const extractedMetadata = file.extractedMetadata.find(
      (em: any) => em.name === suggestion.propertyName
    ) as ExtractedMetadataSchema;

    if (!extractedMetadata) {
      file.extractedMetadata.push({
        name: suggestion.propertyName,
        timestamp: Date(),
        selection: {
          text: suggestion.suggestedText || suggestion.suggestedValue?.toString(),
          selectionRectangles: suggestion.selectionRectangles,
        },
      });
    } else {
      extractedMetadata.timestamp = Date();
      extractedMetadata.selection = {
        text: suggestion.suggestedText || suggestion.suggestedValue?.toString(),
        selectionRectangles: suggestion.selectionRectangles,
      };
    }

    return files.save(file);
  });
};

const buildListQuery = (
  filters: FilterQuery<IXSuggestionType>,
  customFilter: SuggestionCustomFilter | undefined,
  setLanguages: LanguagesListSchema | undefined,
  offset: number,
  limit: number
) => {
  const pipeline = [
    ...getMatchStage(filters, customFilter),
    { $sort: { date: 1, state: -1 } },
    { $skip: offset },
    { $limit: limit },
    ...getEntityStage(setLanguages!),
    ...getCurrentValueStage(),
    ...getFileStage(),
    ...getLabeledValueStage(),
    {
      $project: {
        entityId: '$entity._id',
        entityTemplateId: '$entity.template',
        sharedId: '$entity.sharedId',
        entityTitle: '$entity.title',
        fileId: 1,
        language: 1,
        propertyName: 1,
        extractorId: 1,
        suggestedValue: 1,
        segment: 1,
        currentValue: 1,
        state: 1,
        page: 1,
        date: 1,
        error: 1,
        labeledValue: 1,
        selectionRectangles: 1,
      },
    },
  ];
  return pipeline;
};

// const buildTemplateAggregationsQuery = (_filters: FilterQuery<IXSuggestionType>) => {
//   const { entityTemplate, ...filters } = _filters;
//   const pipeline = [...getMatchStage(filters), ...groupByAndSort('$entityTemplate')];
//   return pipeline;
// };

// const buildStateAggregationsQuery = (_filters: FilterQuery<IXSuggestionType>) => {
//   const { state, ...filters } = _filters;
//   const pipeline = [...getMatchStage(filters), ...groupByAndSort('$state')];
//   return pipeline;
// };

// const fetchAndAggregateSuggestions = async (
//   _filters: Omit<IXSuggestionsFilter, 'language'>,
//   setLanguages: LanguagesListSchema | undefined,
//   offset: number,
//   limit: number
// ) => {
//   const {
//     states,
//     entityTemplates,
//     ...filters
//   }: {
//     states?: string[];
//     entityTemplates?: string[];
//     extractorId?: ObjectIdSchema;
//     state?: { $in: string[] };
//     entityTemplate?: { $in: string[] };
//   } = _filters;
//   if (states) filters.state = { $in: _filters.states || [] };
//   if (entityTemplates) filters.entityTemplate = { $in: _filters.entityTemplates || [] };

//   const count = await IXSuggestionsModel.db
//     .aggregate([{ $match: { ...filters, status: { $ne: 'processing' } } }, { $count: 'count' }])
//     .then(result => (result?.length ? result[0].count : 0));

//   const suggestions = await IXSuggestionsModel.db.aggregate(
//     buildListQuery(filters, setLanguages, offset, limit)
//   );

//   const templateAggregations = await IXSuggestionsModel.db.aggregate(
//     buildTemplateAggregationsQuery(filters)
//   );

//   const stateAggregations = await IXSuggestionsModel.db.aggregate(
//     buildStateAggregationsQuery(filters)
//   );

//   return {
//     suggestions,
//     aggregations: { template: templateAggregations, state: stateAggregations },
//     totalPages: Math.ceil(count / limit),
//   };
// };

const readFilter = (filter: IXSuggestionsFilter) => {
  const { customFilter, entityTemplates, extractorId } = filter;
  const filters: FilterQuery<IXSuggestionType> = {
    extractorId: new ObjectId(extractorId),
  };
  if (entityTemplates?.length) {
    filters.entityTemplate = { $in: entityTemplates };
  }
  filters.extractorId = new ObjectId(filter.extractorId);

  return { customFilter, filters };
};

const Suggestions = {
  getById: async (id: ObjectIdSchema) => IXSuggestionsModel.getById(id),
  getByEntityId: async (sharedId: string) => IXSuggestionsModel.get({ entityId: sharedId }),
  getByExtractor: async (extractorId: ObjectIdSchema) => IXSuggestionsModel.get({ extractorId }),

  get: async (
    filter: IXSuggestionsFilter,
    options: { page?: { size: number; number: number } }
  ) => {
    const offset = options && options.page ? options.page.size * (options.page.number - 1) : 0;
    const DEFAULT_LIMIT = 30;
    const limit = options.page?.size || DEFAULT_LIMIT;
    const { languages: setLanguages } = await settings.get();
    const { customFilter, filters } = readFilter(filter);

    const count = await IXSuggestionsModel.db
      .aggregate(getMatchStage(filters, customFilter, true))
      .then(result => (result?.length ? result[0].count : 0));

    const suggestions = await IXSuggestionsModel.db.aggregate(
      buildListQuery(filters, customFilter, setLanguages, offset, limit)
    );

    return {
      suggestions,
      totalPages: Math.ceil(count / limit),
    };
  },

  updateStates,

  setObsolete: async (query: any) =>
    IXSuggestionsModel.updateMany(query, { $set: { 'state.obsolete': true } }),

  markSuggestionsWithoutSegmentation: async (query: any) => {
    const segmentedFilesIds = await getSegmentedFilesIds();
    await IXSuggestionsModel.updateMany(
      {
        ...query,
        fileId: { $nin: segmentedFilesIds },
      },
      { $set: { 'state.error': true } }
    );
  },

  save: async (suggestion: IXSuggestionType) => Suggestions.saveMultiple([suggestion]),

  saveMultiple: async (_suggestions: IXSuggestionType[]) => {
    const toUpdate = await IXSuggestionsModel.saveMultiple(_suggestions);
    if (toUpdate.length > 0) await updateStates({ _id: { $in: toUpdate.map(s => s._id) } });
  },

  accept: async (acceptedSuggestions: AcceptedSuggestion[]) => {
    const acceptedIds = Array.from(new Set(acceptedSuggestions.map(s => s._id.toString())));
    const suggestions = await IXSuggestionsModel.get({ _id: { $in: acceptedIds } });
    const extractors = new Set(suggestions.map(s => s.extractorId.toString()));
    if (extractors.size > 1) {
      throw new Error('All suggestions must come from the same extractor');
    }
    const foundIds = new Set(suggestions.map(s => s._id.toString()));
    if (!acceptedIds.every(id => foundIds.has(id))) {
      throw new Error('Suggestion(s) not found.');
    }
    if (suggestions.some(s => s.error !== '')) {
      throw new Error('Some Suggestions have an error.');
    }

    const { propertyName } = suggestions[0];
    const property = await templates.getPropertyByName(propertyName);
    const allLanguage = property.type === 'numeric' || property.type === 'date';

    await updateEntitiesWithSuggestion(allLanguage, acceptedSuggestions, suggestions);
    await updateExtractedMetadata(suggestions);
    await Suggestions.updateStates({ _id: { $in: acceptedIds.map(id => new ObjectId(id)) } });
  },

  deleteByEntityId: async (sharedId: string) => {
    await IXSuggestionsModel.delete({ entityId: sharedId });
  },

  delete: IXSuggestionsModel.delete.bind(IXSuggestionsModel),
  registerEventListeners,
};

export { Suggestions };
