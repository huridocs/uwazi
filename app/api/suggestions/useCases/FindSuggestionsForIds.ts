import { UseCase } from 'api/common.v2/contracts/UseCase';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { ModelStatus } from 'shared/types/IXModelSchema';
import { IXModelType } from 'shared/types/IXModelType';
import { IXExtractorType } from 'shared/types/extractorType';
import { EnforcedWithId } from 'api/odm';
import { Extractors, ModelNotReadyError } from 'api/services/informationextraction/ixextractors';
import ixmodels from 'api/services/informationextraction/ixmodels';
import { InformationExtraction } from 'api/services/informationextraction/InformationExtraction';

type Input = {
  extractorId: ObjectIdSchema;
  sharedIds: string[];
};

type Output = {
  total: number | undefined;
  processed: number;
};

export class FindSuggestionsForIds implements UseCase<Input, Output> {
  constructor(private informationExtraction: InformationExtraction) {}

  async execute({ extractorId, sharedIds }: Input): Promise<Output> {
    const [extractor, model] = await FindSuggestionsForIds.getExtractorAndModel(extractorId);
    FindSuggestionsForIds.validateExtractorAndModel(extractor, model, extractorId);

    await FindSuggestionsForIds.updateModelWithSuggestionsProcess(model, sharedIds);
    await this.informationExtraction.sendMaterialsAndTaskSuggestions(extractor, model, false);

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

    if (model.findSuggestionsRunTimestamp) {
      throw new Error('A find suggestions process is already running for this extractor.');
    }
  }

  private static async updateModelWithSuggestionsProcess(
    model: EnforcedWithId<IXModelType>,
    sharedIds: string[]
  ) {
    // This cannot be a ixmodels.save because it would set suggestions as obsolete
    await ixmodels.updateMany(
      { _id: model._id },
      {
        ...model,
        findSuggestionsRunTimestamp: Date.now(),
        findSuggestionsSharedIds: sharedIds,
        findingSuggestions: true,
        findSuggestionsInitialSharedIdsCount: sharedIds.length,
      }
    );
  }
}
