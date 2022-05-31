import { IXModelType } from 'shared/types/IXModelType';
import { IXModelsModel as model } from './IXModelsModel';

export default {
  get: model.get.bind(model),
  delete: model.delete.bind(model),
  save: async (ixmodel: Partial<IXModelType>) => {
    return model.save(ixmodel);
  },
};
