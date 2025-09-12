/* eslint-disable max-statements */
/* eslint-disable max-lines */
import { ObjectId } from 'mongodb';

import { files } from 'api/files/files';
import { EnforcedWithId } from 'api/odm';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import templates from 'api/templates';
import { syncedPromiseLoop } from 'shared/data_utils/promiseUtils';
import { ExtractedMetadataSchema, ObjectIdSchema, PropertySchema } from 'shared/types/commonTypes';
import { FileType } from 'shared/types/fileType';
import { IXSuggestionAggregation, IXSuggestionType } from 'shared/types/suggestionType';
import { objectIndex } from 'shared/data_utils/objectIndex';
import {
  getSegmentedFilesIds,
  propertyTypeIsWithoutExtractedMetadata,
} from 'api/services/informationextraction/ixMaterials';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { IXModelType } from 'shared/types/IXModelType';
import { registerEventListeners } from './eventListeners';
import { updateStates } from './updateState';
import {
  AcceptedSuggestion,
  SuggestionAcceptanceError,
  updateEntitiesWithSuggestion,
} from './updateEntities';

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

  // Balanced sampling for suggestion finding (both test runs and regular runs)
  getBalancedSample: async (
    extractorId: ObjectIdSchema,
    model: EnforcedWithId<IXModelType>,
    maxTotal: number
  ): Promise<IXSuggestionType[]> => {
    const since = model.processRun?.suggestionsRunTimestamp || model.creationDate;
    const baseQuery = {
      extractorId,
      $or: [{ date: null }, { date: { $lt: since } }],
      'state.error': { $ne: true },
    };

    // Get counts for balanced allocation
    const [unlabeledCount, labeledCount] = await Promise.all([
      IXSuggestionsModel.db.countDocuments({ ...baseQuery, 'state.labeled': { $ne: true } }),
      IXSuggestionsModel.db.countDocuments({ ...baseQuery, 'state.labeled': true }),
    ]);

    // Calculate optimal allocation
    const idealHalf = Math.floor(maxTotal / 2);
    let unlabeledSampleSize = Math.min(idealHalf, unlabeledCount);
    let labeledSampleSize = Math.min(idealHalf, labeledCount);

    // Reallocate unused slots
    const totalUsed = unlabeledSampleSize + labeledSampleSize;
    const remainingSlots = maxTotal - totalUsed;

    if (remainingSlots > 0) {
      if (unlabeledCount > unlabeledSampleSize) {
        unlabeledSampleSize = Math.min(unlabeledCount, unlabeledSampleSize + remainingSlots);
      } else if (labeledCount > labeledSampleSize) {
        labeledSampleSize = Math.min(labeledCount, labeledSampleSize + remainingSlots);
      }
    }

    const pipeline = [
      {
        $facet: {
          unlabeled: [
            { $match: { ...baseQuery, 'state.labeled': { $ne: true } } },
            { $sample: { size: unlabeledSampleSize } },
          ],
          labeled: [
            { $match: { ...baseQuery, 'state.labeled': true } },
            { $sample: { size: labeledSampleSize } },
          ],
        },
      },
      {
        $project: {
          suggestions: { $concatArrays: ['$unlabeled', '$labeled'] },
        },
      },
      {
        $unwind: '$suggestions',
      },
      {
        $replaceRoot: { newRoot: '$suggestions' },
      },
    ];

    return (await IXSuggestionsModel.db.aggregate(pipeline)) as IXSuggestionType[];
  },

  // Balanced sampling honoring process-run filters stored in the model. If filters are not provided,
  // default to sampling from the three non-ready statuses: nonProcessed, obsolete, error.
  getSampleForProcess: async (
    extractorId: ObjectIdSchema,
    model: EnforcedWithId<IXModelType>,
    maxTotal: number
  ): Promise<IXSuggestionType[]> => {
    const processRun: any = (model as any)?.processRun || {};
    const filters = processRun?.find?.filters || {};

    const selectedFilters = ['nonProcessed', 'obsolete', 'error'].filter(f => filters?.[f]);
    const useFilters = selectedFilters.length > 0;

    const matchConditions: any[] = [];

    if (filters.nonProcessed || !useFilters) {
      matchConditions.push({ date: null });
    }
    if (filters.obsolete || !useFilters) {
      matchConditions.push({ date: { $ne: null }, 'state.obsolete': true });
    }
    if (filters.error || !useFilters) {
      matchConditions.push({ date: { $ne: null }, 'state.error': true });
    }

    const baseMatch = { extractorId, $or: matchConditions } as any;

    // Count labeled/unlabeled within filtered subset
    const [unlabeledCount, labeledCount] = await Promise.all([
      IXSuggestionsModel.db.countDocuments({ ...baseMatch, 'state.labeled': { $ne: true } }),
      IXSuggestionsModel.db.countDocuments({ ...baseMatch, 'state.labeled': true }),
    ]);

    const idealHalf = Math.floor(maxTotal / 2);
    let unlabeledSampleSize = Math.min(idealHalf, unlabeledCount);
    let labeledSampleSize = Math.min(idealHalf, labeledCount);
    const totalUsed = unlabeledSampleSize + labeledSampleSize;
    const remainingSlots = maxTotal - totalUsed;
    if (remainingSlots > 0) {
      if (unlabeledCount > unlabeledSampleSize) {
        unlabeledSampleSize = Math.min(unlabeledCount, unlabeledSampleSize + remainingSlots);
      } else if (labeledCount > labeledSampleSize) {
        labeledSampleSize = Math.min(labeledCount, labeledSampleSize + remainingSlots);
      }
    }

    const pipeline: any[] = [
      {
        $facet: {
          unlabeled: [
            { $match: { ...baseMatch, 'state.labeled': { $ne: true } } },
            { $sample: { size: unlabeledSampleSize } },
          ],
          labeled: [
            { $match: { ...baseMatch, 'state.labeled': true } },
            { $sample: { size: labeledSampleSize } },
          ],
        },
      },
      { $project: { suggestions: { $concatArrays: ['$unlabeled', '$labeled'] } } },
      { $unwind: '$suggestions' },
      { $replaceRoot: { newRoot: '$suggestions' } },
    ];

    const result = (await IXSuggestionsModel.db.aggregate(pipeline)) as IXSuggestionType[];
    return result;
  },

  aggregate: async (_extractorId: ObjectIdSchema): Promise<IXSuggestionAggregation> => {
    const extractorId = new ObjectId(_extractorId);

    const aggregations: (IXSuggestionAggregation & { _id: ObjectId })[] =
      await IXSuggestionsModel.db.aggregate([
        {
          $match: { extractorId },
        },
        {
          // processed = has a date AND not obsolete AND not error
          $set: {
            processed: {
              $and: [
                { $ne: ['$date', null] },
                { $not: '$state.obsolete' },
                { $not: '$state.error' },
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            // All data
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
            // Status
            nonProcessed: {
              $sum: {
                $cond: [{ $eq: ['$date', null] }, 1, 0],
              },
            },
            obsolete: {
              $sum: {
                $cond: [
                  {
                    $and: [{ $ne: ['$date', null] }, '$state.obsolete'],
                  },
                  1,
                  0,
                ],
              },
            },
            error: {
              $sum: {
                $cond: [
                  {
                    $and: [{ $ne: ['$date', null] }, '$state.error'],
                  },
                  1,
                  0,
                ],
              },
            },
            // Processed (exclude nonProcessed, obsolete, and error)
            match: {
              $sum: {
                $cond: [{ $and: ['$processed', '$state.match'] }, 1, 0],
              },
            },
            mismatch: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      '$processed',
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
            noContext: {
              $sum: {
                $cond: [{ $and: ['$processed', { $not: '$state.hasContext' }] }, 1, 0],
              },
            },
            // Support for accuracy calculation
            processedLabeled: {
              $sum: { $cond: [{ $and: ['$processed', '$state.labeled'] }, 1, 0] },
            },
          },
        },
        {
          $set: {
            accuracy: {
              $cond: [
                { $gt: ['$processedLabeled', 0] },
                { $round: [{ $multiply: [{ $divide: ['$match', '$processedLabeled'] }, 100] }, 2] },
                0,
              ],
            },
          },
        },
        { $unset: 'processedLabeled' },
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
      noContext: 0,
      nonProcessed: 0,
      accuracy: 0,
    };

    return results;
  },

  updateStates,

  setObsolete: async (query: any) =>
    IXSuggestionsModel.updateMany(query, {
      $set: { 'state.obsolete': true, 'state.match': null },
    }),

  markSuggestionsWithoutSegmentation: async (query: any) => {
    const segmentedFilesIds = await getSegmentedFilesIds();
    await IXSuggestionsModel.updateMany(
      {
        ...query,
        fileId: { $nin: segmentedFilesIds },
      },
      { $set: { 'state.error': true, 'state.match': null } }
    );
  },

  markSuggestionsAsTrainingSamples: async (entities: string[], extractorIdString: string) => {
    const extractorId = ObjectId.createFromHexString(extractorIdString);
    await IXSuggestionsModel.updateMany({ extractorId }, { $set: { trainingSample: false } });

    const chunks = ArrayUtils.splitInChunks(entities, 1000);
    await chunks.reduce(async (promise, chunk) => {
      await promise;
      await IXSuggestionsModel.updateMany(
        { entityId: { $in: chunk }, extractorId },
        { $set: { trainingSample: true } }
      );
    }, Promise.resolve());
  },

  getAlreadySeenInFindRun: async (
    extractorId: ObjectIdSchema,
    candidateIds: string[],
    runTimestamp: number
  ): Promise<Set<string>> => {
    const [queuedNow, readyThisRun] = await Promise.all([
      IXSuggestionsModel.db.distinct('entityId', {
        extractorId,
        entityId: { $in: candidateIds },
        status: 'processing',
      }),
      IXSuggestionsModel.db.distinct('entityId', {
        extractorId,
        entityId: { $in: candidateIds },
        'modelData.suggestionsRunTimestamp': runTimestamp,
        status: 'ready',
      }),
    ]);

    return new Set<string>([...queuedNow, ...readyThisRun]);
  },

  save: async (suggestion: IXSuggestionType) => Suggestions.saveMultiple([suggestion]),

  saveMultiple: async (_suggestions: IXSuggestionType[]) =>
    IXSuggestionsModel.saveMultiple(_suggestions),

  createMultiple: async (_suggestions: IXSuggestionType[]) =>
    IXSuggestionsModel.db.createMany(_suggestions),

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
  },

  deleteByEntityId: async (sharedId: string) => {
    await IXSuggestionsModel.delete({ entityId: sharedId });
  },

  delete: IXSuggestionsModel.delete.bind(IXSuggestionsModel),
  registerEventListeners,
};

export { Suggestions };
