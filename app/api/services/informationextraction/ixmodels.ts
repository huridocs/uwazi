import { ObjectId } from 'mongodb';
import { Suggestions } from 'api/suggestions/suggestions';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import { ModelStatus } from 'shared/types/IXModelSchema';
import { IXModelType } from 'shared/types/IXModelType';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { IXModelsModel as model } from './IXModelsModel';

const DEFAULT_MAX_SUGGESTIONS_SIZE = 1000;

type StartTrainingOptions = {
  suggestionsToFind?: number;
};

const unsetFindSuggestionsData = async (ixModelId: ObjectIdSchema) => {
  await model.updateMany(
    { _id: ixModelId },
    {
      $unset: {
        'processRun.suggestionsRunTimestamp': '',
        'processRun.findSuggestionsSharedIds': '',
        'processRun.findSuggestionsInitialSharedIdsCount': '',
      },
    }
  );
};

const initializeFindRunQueue = async (modelId: ObjectIdSchema, sharedIds: string[]) => {
  const [current] = await model.get({ _id: modelId });
  const { extractorId } = current;

  // Trim pre-processed (already has ready, non-obsolete and non-error suggestion)
  const alreadySuggested = (await IXSuggestionsModel.db.distinct('entityId', {
    extractorId,
    entityId: { $in: sharedIds },
    date: { $ne: null },
    'state.obsolete': { $ne: true },
    'state.error': { $ne: true },
  })) as string[];
  const alreadySet = new Set(alreadySuggested);
  const pendingIds = sharedIds.filter(id => !alreadySet.has(id));

  // Establish a run timestamp for this selection
  const runTimestamp = Date.now();

  await model.updateMany(
    { _id: modelId },
    {
      $set: {
        'processRun.suggestionsRunTimestamp': runTimestamp,
        'processRun.findSuggestionsSharedIds': pendingIds,
        findingSuggestions: true,
        'processRun.findSuggestionsInitialSharedIdsCount': sharedIds.length,
        // Persist the entire cohort to support auto-accept of pre-existing ready suggestions
        'processRun.selectedSharedIdsForAutoAccept': sharedIds,
      },
    }
  );
};

const appendToFindRunQueue = async (modelId: ObjectIdSchema, newSharedIds: string[]) => {
  await model.updateMany({ _id: modelId }, [
    {
      $set: {
        'processRun.findSuggestionsSharedIds': {
          $setUnion: [{ $ifNull: ['$processRun.findSuggestionsSharedIds', []] }, newSharedIds],
        },
        findingSuggestions: true,
        'processRun.findSuggestionsInitialSharedIdsCount': {
          $add: [
            { $ifNull: ['$processRun.findSuggestionsInitialSharedIdsCount', 0] },
            {
              $subtract: [
                {
                  $size: {
                    $setUnion: [
                      { $ifNull: ['$processRun.findSuggestionsSharedIds', []] },
                      newSharedIds,
                    ],
                  },
                },
                { $size: { $ifNull: ['$processRun.findSuggestionsSharedIds', []] } },
              ],
            },
          ],
        },
      },
    },
  ]);
};

export default {
  get: model.get.bind(model),
  delete: model.delete.bind(model),
  save: model.save.bind(model),
  saveAndObsoleteSuggestions: async (ixmodel: IXModelType) => {
    const saved = await model.save(ixmodel);
    if (ixmodel.status === ModelStatus.ready) {
      await Suggestions.setObsolete({ extractorId: saved.extractorId });
    }
    return saved;
  },
  startTraining: async (
    extractorId: ObjectIdSchema,
    { suggestionsToFind }: StartTrainingOptions = {}
  ) => {
    const [current] = await model.get({ extractorId });

    const updatedModel = await model.save({
      ...current,
      extractorId,
      findingSuggestions: true,
      status: ModelStatus.processing,
      maxSuggestionsToFind: suggestionsToFind ?? DEFAULT_MAX_SUGGESTIONS_SIZE,
    });
    await model.updateMany({ extractorId }, { $unset: { processRun: '' } });

    await unsetFindSuggestionsData(updatedModel._id);
  },
  startFindingSuggestions: async (extractorId: ObjectIdSchema) => {
    const [current] = await model.get({ extractorId });

    if (!current) {
      throw new Error(`Model with extractorId ${extractorId} not found.`);
    }

    await model.updateMany(
      { _id: current._id },
      {
        $set: {
          findingSuggestions: true,
          status: ModelStatus.processing,
        },
      }
    );
  },
  stopTraining: async (extractorId: ObjectIdSchema) => {
    const [current] = await model.get({ extractorId });

    if (!current) {
      throw new Error(`Model with extractorId ${extractorId} not found.`);
    }

    await model.save({
      ...current,
      findingSuggestions: false,
      status: ModelStatus.ready,
    });

    await unsetFindSuggestionsData(current._id);
  },
  updateMany: model.updateMany.bind(model),
  unsetFindSuggestionsData,
  initializeFindRunQueue,
  appendToFindRunQueue,
  setProcessRun: async (extractorId: string, processRun: any) => {
    const extractorObjectId = ObjectId.createFromHexString(extractorId);
    const processRunToSet = {
      ...processRun,
      suggestionsRunTimestamp: processRun?.suggestionsRunTimestamp || Date.now(),
    };
    await model.updateMany(
      { extractorId: extractorObjectId },
      { $set: { processRun: processRunToSet } }
    );
  },
  unsetProcessRun: async (extractorId: string) => {
    const extractorObjectId = ObjectId.createFromHexString(extractorId);
    await model.updateMany({ extractorId: extractorObjectId }, { $unset: { processRun: '' } });
  },
  setAutoAcceptProgress: async (
    extractorId: ObjectIdSchema | string,
    progress: { total?: number; processed?: number }
  ) => {
    const extractorObjectId =
      typeof extractorId === 'string' ? ObjectId.createFromHexString(extractorId) : extractorId;
    const update: any = {};
    if (typeof progress.total === 'number') {
      update['processRun.autoAcceptProgress.total'] = progress.total;
    }
    if (typeof progress.processed === 'number') {
      update['processRun.autoAcceptProgress.processed'] = progress.processed;
    }
    if (Object.keys(update).length) {
      await model.updateMany({ extractorId: extractorObjectId }, { $set: update });
    }
  },
  incAutoAcceptProcessed: async (extractorId: string, incBy: number) => {
    const extractorObjectId = ObjectId.createFromHexString(extractorId);
    await model.updateMany(
      { extractorId: extractorObjectId },
      { $inc: { 'processRun.autoAcceptProgress.processed': incBy } }
    );
  },
};

export { DEFAULT_MAX_SUGGESTIONS_SIZE };
