import { IXExtractorModel as model } from './IXExtractorModel';

export default {
  get: model.get.bind(model),
  delete: model.delete.bind(model),
  save: model.save.bind(model),
};
