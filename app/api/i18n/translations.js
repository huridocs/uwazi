import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';
import sanitizeResponse from 'api/utils/sanitizeResponse';

export default {
  get() {
    return request.get(`${dbURL}/_design/translations/_view/all`)
    .then((response) => {
      return sanitizeResponse(response.json);
    });
  },

  save(translation) {
    translation.type = 'translation';

    let url = dbURL;
    if (translation._id) {
      url = `${dbURL}/_design/settings/_update/partialUpdate/${translation._id}`;
    }

    return request.post(url, translation)
    .then(response => request.get(`${dbURL}/${response.json.id}`)).then((response) => response.json);
  }
};
