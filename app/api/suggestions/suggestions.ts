/* eslint-disable no-continue */
/* eslint-disable max-statements */
/* eslint-disable max-lines */
import { ObjectId } from 'mongodb';

import { EnforcedWithId } from '#api/odm/index.js';
import { IXSuggestionsModel } from '#api/suggestions/IXSuggestionsModel.js';
import { IXSuggestionsDAOFactory } from './infrastructure/IXSuggestionsDAOFactory.js';
import templates from '#api/core/v1_layer/templates/index.js';
import { ObjectIdSchema, PropertySchema } from '#shared/types/commonTypes.js';
import { BaseFile } from '#api/core/domain/files/BaseFile.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { IXSuggestionAggregation, IXSuggestionType } from '#shared/types/suggestionType.js';
import { objectIndex } from '#shared/data_utils/objectIndex.js';
import { propertyTypeIsWithoutPropertySelections } from '#api/services/informationextraction/ixMaterials.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { IXModelType } from '#shared/types/IXModelType.js';
import { registerEventListeners } from './eventListeners.js';
import { updateStates } from './updateState.js';
import {
  AcceptedSuggestion,
  SuggestionAcceptanceError,
  updateEntitiesWithSuggestion,
} from './updateEntities.js';

const updatePropertySelections = async (
  suggestions: IXSuggestionType[],
  property: PropertySchema
) => {
  if (propertyTypeIsWithoutPropertySelections(property.type)) return;

  const filesDS = FilesDataSourceFactory.default();
  const filesService = FilesServiceFactory.default();
  const transactionManager = TransactionManagerFactory.default();

  const suggestionFileIds = suggestions.map(s => s.fileId).filter(Boolean);
  if (!suggestionFileIds.length) return;

  const fetchedFiles = await filesDS.getByIds(suggestionFileIds as string[]);
  const filesById = objectIndex(
    fetchedFiles,
    f => f.id.toString() || '',
    f => f
  );

  const updatedFiles: BaseFile[] = [];

  for (const suggestion of suggestions) {
    const fileId = suggestion.fileId?.toString();
    if (!fileId) continue;

    const file = filesById[fileId];
    if (!file) continue;

    const updated = file.update({
      propertySelections: [
        {
          name: suggestion.propertyName,
          timestamp: Date(),
          selection: {
            text: suggestion.suggestedText || suggestion.suggestedValue?.toString(),
            selectionRectangles: suggestion.selectionRectangles,
          },
        },
      ],
    });

    if (updated.hasChanged) {
      updatedFiles.push(updated);
    }
  }

  if (updatedFiles.length > 0) {
    await transactionManager.run(async () => {
      await filesService.bulkUpsert(updatedFiles);
    });
  }
};

const dao = () => IXSuggestionsDAOFactory.default();

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
            useForTraining: { $sum: { $cond: ['$useForTraining', 1, 0] } },
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

  setObsolete: async (extractorId: ObjectIdSchema) => dao().markObsoleteForExtractor(extractorId),

  markSuggestionsAsTrainingSamples: async (entities: string[], extractorIdString: string) => {
    const extractorId = ObjectId.createFromHexString(extractorIdString);
    await dao().clearTrainingSamplesForExtractor(extractorId);

    const chunks = ArrayUtils.splitInChunks(entities, 1000);
    await chunks.reduce(async (promise, chunk) => {
      await promise;
      await dao().markTrainingSamples(extractorId, chunk);
    }, Promise.resolve());
  },

  getAlreadySeenInFindRun: async (
    extractorId: ObjectIdSchema,
    candidateIds: string[],
    runTimestamp: number
  ): Promise<Set<string>> =>
    new Set(await dao().getEntityIdsSeenInRun(extractorId, candidateIds, runTimestamp)),

  save: async (suggestion: IXSuggestionType) => Suggestions.saveMultiple([suggestion]),

  saveMultiple: async (_suggestions: Partial<IXSuggestionType>[]) =>
    dao().saveMultiple(_suggestions),

  createMultiple: async (_suggestions: IXSuggestionType[]) => dao().createMultiple(_suggestions),

  accept: async (acceptedSuggestions: AcceptedSuggestion[]) => {
    const acceptedIds = Array.from(new Set(acceptedSuggestions.map(s => s._id.toString())));
    const suggestions = await dao().getByIds(acceptedIds);
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
    await updatePropertySelections(suggestions, property);
  },

  deleteByEntityId: async (sharedId: string) => dao().deleteByEntityId(sharedId),
  deleteByEntityAndTemplate: async (sharedId: string, templateId: string) =>
    dao().deleteByEntityAndTemplate(sharedId, templateId),
  deleteByExtractorId: async (extractorId: ObjectIdSchema) =>
    dao().deleteByExtractorId(extractorId),
  deleteByExtractorIds: async (extractorIds: ObjectIdSchema[]) =>
    dao().deleteByExtractorIds(extractorIds),
  deleteByTemplatesAndExtractors: async (templateIds: string[], extractorIds: ObjectIdSchema[]) =>
    dao().deleteByTemplatesAndExtractors(templateIds, extractorIds),
  deleteByFileIds: async (fileIds: ObjectIdSchema[]) => dao().deleteByFileIds(fileIds),
  registerEventListeners,
};

export { Suggestions };
