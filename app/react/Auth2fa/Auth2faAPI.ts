/** @format */
/* TEST!!! */
import api from 'app/utils/api';

export default {
  getQR(requestParams: {} | undefined) {
    return api.get('auth2fa-QR', requestParams).then((response: { json: any }) => response.json);
  },
};
