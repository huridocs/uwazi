import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { ClientSettings } from 'app/apiResponseTypes';

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
