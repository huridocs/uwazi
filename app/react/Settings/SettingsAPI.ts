// @ts-expect-error TS(2307): Cannot find module '../../utils/api.js' or its cor... Remove this comment to see the full error message
import api from '../../utils/api.js';
// @ts-expect-error TS(2307): Cannot find module '../../utils/RequestParams.js' ... Remove this comment to see the full error message
import { RequestParams } from '../../utils/RequestParams.js';
// @ts-expect-error TS(2307): Cannot find module '../../apiResponseTypes.js' or ... Remove this comment to see the full error message
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
