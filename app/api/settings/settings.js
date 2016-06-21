import {db_url as dbUrl} from 'api/config/database';
import request from 'shared/JSONRequest';

export default {
  get() {
    return request.get(`${dbUrl}/_design/settings/_view/all`)
    .then((result) => {
      return result.json.rows[0].value;
    });
  },

  save(settings) {
    return request.post(dbUrl, settings)
    .then((result) => {
      return result.json;
    });
  }
};
