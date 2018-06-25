import model from './uploadsModel';

export default {
  save: model.save.bind(model),
  get: model.get.bind(model),
};
