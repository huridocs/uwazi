/* eslint-disable max-lines */
import { ObjectId } from 'mongodb';

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
  PropertySchema,
} from 'shared/types/commonTypes';
import { FileType } from 'shared/types/fileType';
import {
  IXSuggestionAggregation,
  IXSuggestionsFilter,
  IXSuggestionsQuery,
  IXSuggestionType,
  SuggestionCustomFilter,
} from 'shared/types/suggestionType';
import { objectIndex } from 'shared/data_utils/objectIndex';
import {
  getSegmentedFilesIds,
  propertyTypeIsWithoutExtractedMetadata,
} from 'api/services/informationextraction/getFiles';
import { Extractors } from 'api/services/informationextraction/ixextractors';
import { registerEventListeners } from './eventListeners';
import {
  getCurrentValueStage,
  getEntityStage,
  getFileStage,
  getLabeledValueStage,
  getMatchStage,
} from './pipelineStages';
import { postProcessCurrentValues, updateStates } from './updateState';
import {
  AcceptedSuggestion,
  SuggestionAcceptanceError,
  updateEntitiesWithSuggestion,
} from './updateEntities';

const DEFAULT_LIMIT = 30;

const updateExtractedMetadata = async (
  suggestions: IXSuggestionType[],
  property: PropertySchema
) => {
  if (propertyTypeIsWithoutExtractedMetadata(property.type)) return;

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

    await files.save(file);
  });
};

const buildListQuery = (
  extractorId: ObjectId,
  customFilter: SuggestionCustomFilter | undefined,
  setLanguages: LanguagesListSchema | undefined,
  options: { page?: IXSuggestionsQuery['page']; sort?: IXSuggestionsQuery['sort'] }
) => {
  const offset = options && options.page ? options.page.size * (options.page.number - 1) : 0;
  const limit = options.page?.size || DEFAULT_LIMIT;
  const { sort } = options;

  const sortOrder = sort?.order === 'desc' ? -1 : 1;
  const sorting = sort?.property ? { [sort.property]: sortOrder } : { date: 1, state: -1 };

  const pipeline = [
    ...getMatchStage(extractorId, customFilter),
    ...getEntityStage(setLanguages!),
    ...getCurrentValueStage(),
    {
      $addFields: {
        entityTitle: '$entity.title',
      },
    },
    { $sort: sorting },
    { $skip: offset },
    { $limit: limit },
    ...getFileStage(),
    ...getLabeledValueStage(),
    {
      $project: {
        entityId: '$entity._id',
        entityTemplateId: '$entity.template',
        sharedId: '$entity.sharedId',
        entityTitle: 1,
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

const readFilter = (filter: IXSuggestionsFilter) => {
  const { customFilter, extractorId: _extractorId } = filter;
  const extractorId = new ObjectId(_extractorId);
  return { customFilter, extractorId };
};

const postProcessSuggestions = async (_suggestions: any, extractorId: ObjectId) => {
  let suggestions = _suggestions;
  if (suggestions.length > 0) {
    const extractor = await Extractors.getById(extractorId);
    const propertyName = extractor?.property;
    const property = await templates.getPropertyByName(propertyName!);
    const propertyType = property.type;
    suggestions = postProcessCurrentValues(suggestions, propertyType);
  }
  return suggestions;
};

const propertyTypesWithAllLanguages = new Set(['numeric', 'date', 'select', 'multiselect']);

const needsAllLanguages = (propertyType: PropertySchema['type']) =>
  propertyTypesWithAllLanguages.has(propertyType);

const validTypesForPartialAcceptance = new Set(['multiselect', 'relationship']);

const typeIsValidForPartialAcceptance = (propertyType: string) =>
  validTypesForPartialAcceptance.has(propertyType);

const validatePartialAcceptanceTypeConstraint = (
  acceptedSuggestions: AcceptedSuggestion[],
  property: PropertySchema
) => {
  const addedValuesExist = acceptedSuggestions.some(s => s.addedValues);
  const removedValuesExist = acceptedSuggestions.some(s => s.removedValues);
  const partialAcceptanceTriggered = addedValuesExist || removedValuesExist;
  if (!typeIsValidForPartialAcceptance(property.type) && partialAcceptanceTriggered) {
    throw new SuggestionAcceptanceError(
      'Partial acceptance is only allowed for multiselects or relationships.'
    );
  }
};

const Suggestions = {
  getById: async (id: ObjectIdSchema) => IXSuggestionsModel.getById(id),
  getByEntityId: async (sharedId: string) => IXSuggestionsModel.get({ entityId: sharedId }),
  getByExtractor: async (extractorId: ObjectIdSchema) => IXSuggestionsModel.get({ extractorId }),

  get: async (
    filter: IXSuggestionsFilter,
    options: {
      page?: IXSuggestionsQuery['page'];
      sort?: IXSuggestionsQuery['sort'];
    }
  ) => {
    const { languages: setLanguages } = await settings.get();
    const { customFilter, extractorId } = readFilter(filter);

    const count = await IXSuggestionsModel.db
      .aggregate(getMatchStage(extractorId, customFilter, true))
      .then(result => (result?.length ? result[0].count : 0));

    let suggestions = await IXSuggestionsModel.db.aggregate(
      buildListQuery(extractorId, customFilter, setLanguages, options)
    );
    suggestions = await postProcessSuggestions(suggestions, extractorId);

    return {
      suggestions,
      totalPages: Math.ceil(count / (options.page?.size || DEFAULT_LIMIT)),
    };
  },

  aggregate: async (_extractorId: ObjectIdSchema): Promise<IXSuggestionAggregation> => {
    const extractorId = new ObjectId(_extractorId);

    const aggregations: (IXSuggestionAggregation & { _id: ObjectId })[] =
      await IXSuggestionsModel.db.aggregate([
        {
          $match: { extractorId },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            labeled: { $sum: { $cond: ['$state.labeled', 1, 0] } },
            nonLabeled: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$state.labeled', undefined] },
                      { $ne: ['$state.labeled', null] },
                      { $not: '$state.labeled' },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            match: { $sum: { $cond: ['$state.match', 1, 0] } },
            mismatch: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$state.match', undefined] },
                      { $ne: ['$state.match', null] },
                      { $not: '$state.match' },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            obsolete: { $sum: { $cond: ['$state.obsolete', 1, 0] } },
            error: { $sum: { $cond: ['$state.error', 1, 0] } },
          },
        },
      ]);

    const { _id, ...results } = aggregations[0] || {
      _id: null,
      total: 0,
      labeled: 0,
      nonLabeled: 0,
      match: 0,
      mismatch: 0,
      obsolete: 0,
      error: 0,
    };

    return results;
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
    validatePartialAcceptanceTypeConstraint(acceptedSuggestions, property);
    const allLanguage = needsAllLanguages(property.type);

    await updateEntitiesWithSuggestion(allLanguage, acceptedSuggestions, suggestions, property);
    await updateExtractedMetadata(suggestions, property);
    await Suggestions.updateStates({ _id: { $in: acceptedIds.map(id => new ObjectId(id)) } });
  },

  deleteByEntityId: async (sharedId: string) => {
    await IXSuggestionsModel.delete({ entityId: sharedId });
  },

  delete: IXSuggestionsModel.delete.bind(IXSuggestionsModel),
  registerEventListeners,
};

export { Suggestions };
