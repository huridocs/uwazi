import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';

export default {
  get(requestParams = new RequestParams()) {
    return api.get('v2/relationships', requestParams).then(response => response.json);
  },

  post(requestParams = new RequestParams()) {
    return api.post('v2/relationships', requestParams).then(response => response.json);
  },

  delete(requestParams = new RequestParams()) {
    return api.delete('v2/relationships', requestParams).then(response => response.json);
  },
};
