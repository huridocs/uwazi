import { UseCase } from 'api/common.v2/contracts/UseCase';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { ModelStatus } from 'shared/types/IXModelSchema';
import { IXModelType } from 'shared/types/IXModelType';
import { IXExtractorType } from 'shared/types/extractorType';
import { EnforcedWithId } from 'api/odm';
import { Extractors, ModelNotReadyError } from 'api/services/informationextraction/ixextractors';
import ixmodels from 'api/services/informationextraction/ixmodels';
import { InformationExtraction } from 'api/services/informationextraction/InformationExtraction';
import { Suggestions } from '../suggestions';

type Input = {
  extractorId: ObjectIdSchema;
  sharedIds: string[];
};

type Output = {
  total: number | undefined;
  processed: number;
};

type UpdateFindRunQueueOptions = {
  appendSharedIds: boolean;
};

export class FindSuggestionsForIds implements UseCase<Input, Output> {
  constructor(private informationExtraction: InformationExtraction) {}

  async execute({ extractorId, sharedIds }: Input): Promise<Output> {
    const [extractor, model] = await FindSuggestionsForIds.getExtractorAndModel(extractorId);
    FindSuggestionsForIds.validateExtractorAndModel(extractor, model, extractorId);

    const { foundNewIds } = await FindSuggestionsForIds.processNewOrAppendSharedIds(
      model,
      sharedIds
    );

    if (foundNewIds) {
      await this.informationExtraction.sendMaterialsAndTaskSuggestions(extractor!, model, false);
    }

    const [updatedModel] = await ixmodels.get({ extractorId });
    return this.informationExtraction.getSuggestionsStatus(extractorId, updatedModel!);
  }

  private static async getExtractorAndModel(extractorId: ObjectIdSchema) {
    const [[extractor], [model]] = await Promise.all([
      Extractors.get({ _id: extractorId }),
      ixmodels.get({ extractorId }),
    ]);
    return [extractor, model] as const;
  }

  private static validateExtractorAndModel(
    extractor: EnforcedWithId<IXExtractorType> | undefined,
    model: EnforcedWithId<IXModelType> | undefined,
    extractorId: ObjectIdSchema
  ) {
    if (!extractor) {
      throw new Error('Extractor not found');
    }

    if (!model || model.status !== ModelStatus.ready) {
      throw new ModelNotReadyError(extractorId.toString());
    }

    // Prevent individual find while training/test-run suggestions are running
    if (model.findingSuggestions && !model.processRun?.suggestionsRunTimestamp) {
      throw new Error("Model is training. Individual 'Find suggestions' is disabled.");
    }
  }

  private static async updateFindRunQueue(
    model: EnforcedWithId<IXModelType>,
    newSharedIds: string[],
    options: UpdateFindRunQueueOptions
  ) {
    if (options.appendSharedIds) {
      await ixmodels.appendToFindRunQueue(model._id!, newSharedIds);
    } else {
      await ixmodels.initializeFindRunQueue(model._id!, newSharedIds);
    }
  }

  private static async getAlreadySeenInThisRun(
    model: EnforcedWithId<IXModelType>,
    candidateIds: string[]
  ) {
    return Suggestions.getAlreadySeenInFindRun(
      model.extractorId,
      candidateIds,
      model.processRun!.suggestionsRunTimestamp!
    );
  }

  private static async processNewOrAppendSharedIds(
    model: EnforcedWithId<IXModelType>,
    sharedIds: string[]
  ) {
    const uniqueRequestedSharedIds = Array.from(new Set(sharedIds));

    if (model.processRun?.suggestionsRunTimestamp) {
      const currentQueue = new Set(model.processRun?.findSuggestionsSharedIds || []);
      const seen = await this.getAlreadySeenInThisRun(model, uniqueRequestedSharedIds);

      // Exclude those already in the current queue or already queued/processed in this run
      const uniqueNew = uniqueRequestedSharedIds.filter(
        id => !currentQueue.has(id) && !seen.has(id)
      );

      if (uniqueNew.length === 0) {
        return { foundNewIds: false };
      }

      await FindSuggestionsForIds.updateFindRunQueue(model, uniqueNew, { appendSharedIds: true });
    } else {
      await FindSuggestionsForIds.updateFindRunQueue(model, uniqueRequestedSharedIds, {
        appendSharedIds: false,
      });
    }

    return { foundNewIds: true };
  }
}
