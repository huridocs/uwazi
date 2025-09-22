import api from '../../utils/api.js';
import { RequestParams } from '../../utils/RequestParams.js';
import { ClientSettings } from '../../apiResponseTypes.js';

export default {
  async save(settings: RequestParams<ClientSettings>): Promise<ClientSettings> {
    return api.post('settings', settings).then((response: any) => response.json);
  },

  async get(query: RequestParams = new RequestParams()): Promise<ClientSettings> {
    return api.get('settings', query).then((response: any) => response.json);
  },

  async stats(query: RequestParams = new RequestParams()) {
    return api.get('stats', query).then((response: any) => response.json);
  },
};
