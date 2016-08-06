import {db_url as dbUrl} from 'api/config/database';
import request from 'shared/JSONRequest';

export default {
  get() {
    return request.get(`${dbUrl}/_design/settings/_view/all`)
    .then((result) => {
      if (result.json.rows.length) {
        return result.json.rows[0].value;
      }

      return {};
    });
  },

  save(settings) {
    settings.type = 'settings';
    return request.post(dbUrl, settings)
    .then((result) => {
      return result.json;
    });
  }
};
