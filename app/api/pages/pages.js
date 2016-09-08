import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';
import date from 'api/utils/date.js';
import sanitizeResponse from '../utils/sanitizeResponse';

export default {
  save(doc, user) {
    doc.type = 'page';
    if (!doc._id) {
      doc.user = user;
      doc.creationDate = date.currentUTC();
    }

    let url = dbURL;
    if (doc._id) {
      url = dbURL + '/_design/pages/_update/partialUpdate/' + doc._id;
    }

    return request.post(url, doc)
    .then(response => request.get(`${dbURL}/${response.json.id}`))
    .then(response => response.json);
  },

  list(keys) {
    let url = `${dbURL}/_design/pages/_view/list`;
    if (keys) {
      url += `?keys=${JSON.stringify(keys)}`;
    }
    return request.get(url)
    .then((response) => {
      return sanitizeResponse(response.json);
    });
  },

  delete(id) {
    return request.get(`${dbURL}/${id}`)
    .then(doc => request.delete(`${dbURL}/${doc.json._id}?rev=${doc.json._rev}`))
    .then((response) => {
      return response.json;
    });
  }
};
