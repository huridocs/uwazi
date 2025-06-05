import { Suggestions } from 'api/suggestions/suggestions';
import { ModelStatus } from 'shared/types/IXModelSchema';
import { IXModelType } from 'shared/types/IXModelType';
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
};
