/** @format */
// TEST!!!
import api from 'app/utils/api';

interface Secret {
  otpauth: string;
  secret: string;
}

export default {
  async getSecret(requestParams: import('../utils/RequestParams').RequestParams): Promise<Secret> {
    const response = await api.get('auth2fa-secret', requestParams);
    return response.json;
  },
};
