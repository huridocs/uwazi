import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';

export default {
  get() {
    return request.get(`${dbURL}/_design/settings/_view/all`)
    .then((result) => {
      if (result.json.rows.length) {
        return result.json.rows[0].value;
      }

      return {};
    });
  },

  save(doc) {
    doc.type = 'settings';

    let url = dbURL;
    if (doc._id) {
      url = `${dbURL}/_design/settings/_update/partialUpdate/${doc._id}`;
    }

    return request.post(url, doc)
    .then(response => this.get(`${dbURL}/${response.json.id}`));
  }
};
