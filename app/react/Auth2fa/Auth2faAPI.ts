/** @format */

import api from 'app/utils/api';
import { RequestParams } from '../utils/RequestParams';

export interface Secret {
  otpauth: string;
  secret: string;
}

export interface Success {
  success: boolean;
}

export default {
  async setSecret(requestParams: RequestParams): Promise<Secret> {
    const response = await api.post('auth2fa-secret', requestParams);
    return response.json;
  },

  async enable(requestParams: RequestParams): Promise<Success> {
    const response = await api.post('auth2fa-enable', requestParams);
    return response.json;
  },

  async reset2fa(requestParams: RequestParams): Promise<Success> {
    const response = await api.post('auth2fa-reset', requestParams);
    return response.json;
  },
};
