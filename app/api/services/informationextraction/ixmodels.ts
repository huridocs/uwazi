import { Suggestions } from 'api/suggestions/suggestions';
import { ModelStatus } from 'shared/types/IXModelSchema';
import { IXModelType } from 'shared/types/IXModelType';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { IXModelsModel as model } from './IXModelsModel';
import { IXExtractorModel } from './IXExtractorModel';

export default {
  get: model.get.bind(model),
  delete: model.delete.bind(model),
  save: async (ixmodel: IXModelType) => {
    const saved = await model.save(ixmodel);
    if (ixmodel.status === ModelStatus.ready) {
      const extractor = await IXExtractorModel.getById(ixmodel.extractorId);
      await Suggestions.setObsolete({ extractorId: saved.extractorId });

      if (extractor?.source.pdf) {
        await Suggestions.markSuggestionsWithoutSegmentation({ extractorId: saved.extractorId });
      }
    }
    return saved;
  },
  startTraining: async (extractorId: ObjectIdSchema) => {
    const [current] = await model.get({ extractorId });

    await model.save({
      ...current,
      extractorId,
      findingSuggestions: true,
    });
  },
  startFindingSuggestions: async (extractorId: ObjectIdSchema) => {
    const [current] = await model.get({ extractorId });

    if (!current) {
      throw new Error(`Model with extractorId ${extractorId} not found.`);
    }

    await model.save({
      ...current,
      findingSuggestions: true,
      status: ModelStatus.processing,
      creationDate: new Date().getTime(),
    });
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
  },
};
