import { Suggestions } from 'api/suggestions/suggestions';
import { ModelStatus } from 'shared/types/IXModelSchema';
import { IXModelType } from 'shared/types/IXModelType';
import { IXModelsModel as model } from './IXModelsModel';

export default {
  get: model.get.bind(model),
  delete: model.delete.bind(model),
  save: async (ixmodel: IXModelType) => {
    const saved = await model.save(ixmodel);
    if (ixmodel.status === ModelStatus.ready) {
      await Suggestions.setObsolete({ extractorId: saved.extractorId });
      await Suggestions.markSuggestionsWithoutSegmentation({ extractorId: saved.extractorId });
    }
    return saved;
  },
};
