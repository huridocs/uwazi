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
  propertyTypeIsSelectOrMultiSelect,
} from 'api/services/informationextraction/getFiles';
import { Extractors } from 'api/services/informationextraction/ixextractors';
import { registerEventListeners } from './eventListeners';
import {
  baseQueryFragment,
  filterFragments,
  getCurrentValueStage,
  getEntityStage,
  getFileStage,
  getLabeledValueStage,
  getMatchStage,
  groupByAndCount,
} from './pipelineStages';
import { postProcessCurrentValues, updateStates } from './updateState';
import {
  AcceptedSuggestion,
  SuggestionAcceptanceError,
  updateEntitiesWithSuggestion,
} from './updateEntities';

const updateExtractedMetadata = async (
  suggestions: IXSuggestionType[],
  property: PropertySchema
) => {
  if (propertyTypeIsSelectOrMultiSelect(property.type)) return;

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
  offset: number,
  limit: number,
  sort?: IXSuggestionsQuery['sort']
) => {
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

async function getLabeledCounts(extractorId: ObjectId) {
  const labeledAggregationQuery = [
    {
      $match: {
        ...baseQueryFragment(extractorId),
        ...filterFragments.labeled._fragment,
      },
    },
    ...groupByAndCount('$state.match'),
  ];
  const labeledAggregation: { _id: boolean; count: number }[] =
    await IXSuggestionsModel.db.aggregate(labeledAggregationQuery);
  const matchCount =
    labeledAggregation.find((aggregation: any) => aggregation._id === true)?.count || 0;
  const mismatchCount =
    labeledAggregation.find((aggregation: any) => aggregation._id === false)?.count || 0;
  const labeledCount = matchCount + mismatchCount;
  return { labeledCount, matchCount, mismatchCount };
}

const getNonLabeledCounts = async (_extractorId: ObjectId) => {
  const extractorId = new ObjectId(_extractorId);
  const unlabeledMatch = {
    ...baseQueryFragment(extractorId),
    ...filterFragments.nonLabeled._fragment,
  };
  const nonLabeledCount = await IXSuggestionsModel.count(unlabeledMatch);
  const noContextCount = await IXSuggestionsModel.count({
    ...unlabeledMatch,
    ...filterFragments.nonLabeled.noContext,
  });
  const noSuggestionCount = await IXSuggestionsModel.count({
    ...unlabeledMatch,
    ...filterFragments.nonLabeled.noSuggestion,
  });
  const obsoleteCount = await IXSuggestionsModel.count({
    ...unlabeledMatch,
    ...filterFragments.nonLabeled.obsolete,
  });
  const othersCount = await IXSuggestionsModel.count({
    ...unlabeledMatch,
    ...filterFragments.nonLabeled.others,
  });
  return { nonLabeledCount, noContextCount, noSuggestionCount, obsoleteCount, othersCount };
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

const validatePartialAcceptanceTypeConstraint = (
  acceptedSuggestions: AcceptedSuggestion[],
  property: PropertySchema
) => {
  const addedValuesExist = acceptedSuggestions.some(s => s.addedValues);
  const removedValuesExist = acceptedSuggestions.some(s => s.removedValues);
  const multiSelectOnly = addedValuesExist || removedValuesExist;
  if (property.type !== 'multiselect' && multiSelectOnly) {
    throw new SuggestionAcceptanceError('Partial acceptance is only allowed for multiselects.');
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
    const offset = options && options.page ? options.page.size * (options.page.number - 1) : 0;
    const DEFAULT_LIMIT = 30;
    const limit = options.page?.size || DEFAULT_LIMIT;
    const { languages: setLanguages } = await settings.get();
    const { customFilter, extractorId } = readFilter(filter);

    const count = await IXSuggestionsModel.db
      .aggregate(getMatchStage(extractorId, customFilter, true))
      .then(result => (result?.length ? result[0].count : 0));

    let suggestions = await IXSuggestionsModel.db.aggregate(
      buildListQuery(extractorId, customFilter, setLanguages, offset, limit, options.sort)
    );
    suggestions = await postProcessSuggestions(suggestions, extractorId);

    return {
      suggestions,
      totalPages: Math.ceil(count / limit),
    };
  },

  aggregate: async (_extractorId: ObjectIdSchema): Promise<IXSuggestionAggregation> => {
    const extractorId = new ObjectId(_extractorId);
    const { labeledCount, matchCount, mismatchCount } = await getLabeledCounts(extractorId);
    const { nonLabeledCount, noContextCount, noSuggestionCount, obsoleteCount, othersCount } =
      await getNonLabeledCounts(extractorId);
    const totalCount = labeledCount + nonLabeledCount;
    return {
      total: totalCount,
      labeled: {
        _count: labeledCount,
        match: matchCount,
        mismatch: mismatchCount,
      },
      nonLabeled: {
        _count: nonLabeledCount,
        noContext: noContextCount,
        noSuggestion: noSuggestionCount,
        obsolete: obsoleteCount,
        others: othersCount,
      },
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
