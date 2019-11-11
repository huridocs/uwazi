/** @format */
// TEST!!!
import api from 'app/utils/api';

interface Secret {
  otpauth: string;
  secret: string;
}

export default {
  getSecret(requestParams: import('../utils/RequestParams').RequestParams): Secret {
    return api
      .get('auth2fa-secret', requestParams)
      .then((response: { json: any }) => response.json);
  },
};
