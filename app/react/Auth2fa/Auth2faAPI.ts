/** @format */
// TEST!!!
import api from 'app/utils/api';

interface Secret {
  otpauth: string;
  secret: string;
}

interface Success {
  success: boolean;
}

export default {
  async setSecret(requestParams: import('../utils/RequestParams').RequestParams): Promise<Secret> {
    const response = await api.post('auth2fa-secret', requestParams);
    return response.json;
  },

  async enable(requestParams: import('../utils/RequestParams').RequestParams): Promise<Success> {
    const response = await api.post('auth2fa-enable', requestParams);
    return response.json;
  },
};
