import { EntitiesAPI } from '../Entities/EntitiesAPI.js';

const documentsAPI = {
  get(requestParams) {
    return EntitiesAPI.get(requestParams);
  },

  save(requestParams) {
    return EntitiesAPI.save(requestParams);
  },

  delete(requestParams) {
    return EntitiesAPI.delete(requestParams);
  },
};
export { documentsAPI };
