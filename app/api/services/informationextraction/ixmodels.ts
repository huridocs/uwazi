import { Suggestions } from '#api/suggestions/suggestions.js';
import { IXSuggestionsModel } from '#api/suggestions/IXSuggestionsModel.js';
import { ModelStatus } from '#shared/types/IXModelSchema.js';
import { IXModelType } from '#shared/types/IXModelType.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { IXModelsDAOFactory } from './infrastructure/IXModelsDAOFactory.js';

const DEFAULT_MAX_SUGGESTIONS_SIZE = 1000;

type StartTrainingOptions = {
  suggestionsToFind?: number;
};

const dao = () => IXModelsDAOFactory.default();

const unsetFindSuggestionsData = async (ixModelId: ObjectIdSchema) =>
  dao().clearFindRunQueue(ixModelId);

/**
 * Reads `ixsuggestions` directly, which the models DAO cannot do. It stays here until stage 4c
 * gives suggestions a port of its own; the models port only receives the ids this computes.
 */
const findPendingSharedIds = async (extractorId: ObjectIdSchema, sharedIds: string[]) => {
  // Trim pre-processed sharedIds only when they are fully healthy.
  // Keep IDs pending when:
  // - they have any obsolete suggestion, OR
  // - they have no valid non-obsolete/non-error suggestion yet.
  const [validNonObsoleteIds, obsoleteIds] = (await Promise.all([
    IXSuggestionsModel.db.distinct('entityId', {
      extractorId,
      entityId: { $in: sharedIds },
      date: { $ne: null },
      'state.obsolete': { $ne: true },
      'state.error': { $ne: true },
    }),
    IXSuggestionsModel.db.distinct('entityId', {
      extractorId,
      entityId: { $in: sharedIds },
      date: { $ne: null },
      'state.obsolete': true,
    }),
  ])) as [string[], string[]];
  const validSet = new Set(validNonObsoleteIds);
  const obsoleteSet = new Set(obsoleteIds);
  return sharedIds.filter(id => obsoleteSet.has(id) || !validSet.has(id));
};

const initializeFindRunQueue = async (modelId: ObjectIdSchema, sharedIds: string[]) => {
  const current = await dao().getById(modelId);
  const pendingIds = await findPendingSharedIds(current!.extractorId, sharedIds);

  await dao().initializeFindRunQueue(modelId, {
    pendingIds,
    selectedSharedIds: sharedIds,
    // Establish a run timestamp for this selection
    runTimestamp: Date.now(),
  });
};

export default {
  getByExtractorId: async (extractorId: ObjectIdSchema) => dao().getByExtractorId(extractorId),
  getById: async (id: ObjectIdSchema) => dao().getById(id),
  save: async (ixmodel: Partial<IXModelType>) => dao().save(ixmodel),
  saveAndObsoleteSuggestions: async (ixmodel: Partial<IXModelType>) => {
    const saved = await dao().save(ixmodel);
    if (ixmodel.status === ModelStatus.ready) {
      await Suggestions.setObsolete({ extractorId: saved.extractorId });
    }
    return saved;
  },
  startTraining: async (
    extractorId: ObjectIdSchema,
    { suggestionsToFind }: StartTrainingOptions = {}
  ) =>
    dao().markTraining(extractorId, {
      maxSuggestionsToFind: suggestionsToFind ?? DEFAULT_MAX_SUGGESTIONS_SIZE,
    }),
  startFindingSuggestions: async (extractorId: ObjectIdSchema) => {
    const updated = await dao().markFindingSuggestions(extractorId);

    if (!updated) {
      throw new Error(`Model with extractorId ${extractorId} not found.`);
    }
  },
  stopTraining: async (extractorId: ObjectIdSchema) => {
    const updated = await dao().markReady(extractorId);

    if (!updated) {
      throw new Error(`Model with extractorId ${extractorId} not found.`);
    }
  },
  /** Same transition as `stopTraining`, for the caller that reports a missing model instead of throwing. */
  markReady: async (extractorId: ObjectIdSchema) => dao().markReady(extractorId),
  unsetFindSuggestionsData,
  initializeFindRunQueue,
  appendToFindRunQueue: async (modelId: ObjectIdSchema, newSharedIds: string[]) =>
    dao().appendToFindRunQueue(modelId, newSharedIds),
  takeFromFindRunQueue: async (modelId: ObjectIdSchema, batchSize: number) =>
    dao().takeFromFindRunQueue(modelId, batchSize),
  setProcessRun: async (extractorId: ObjectIdSchema, processRun: IXModelType['processRun']) =>
    dao().setProcessRun(extractorId, {
      ...processRun,
      suggestionsRunTimestamp: processRun?.suggestionsRunTimestamp || Date.now(),
    }),
  unsetProcessRun: async (extractorId: ObjectIdSchema) => dao().clearProcessRun(extractorId),
  setAutoAcceptProgress: async (
    extractorId: ObjectIdSchema,
    progress: { total?: number; processed?: number }
  ) => dao().setAutoAcceptProgress(extractorId, progress),
  incAutoAcceptProcessed: async (extractorId: ObjectIdSchema, incBy: number) =>
    dao().incrementAutoAcceptProcessed(extractorId, incBy),
};

export { DEFAULT_MAX_SUGGESTIONS_SIZE };
