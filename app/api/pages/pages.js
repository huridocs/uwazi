import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';
import date from 'api/utils/date.js';
import sanitizeResponse from '../utils/sanitizeResponse';
import ID from 'shared/uniqueId';
import settings from '../settings';

export default {
  save(doc, user, language) {
    doc.type = 'page';
    if (!doc._id) {
      doc.user = user;
      doc.creationDate = date.currentUTC();
    }

    if (doc.sharedId) {
      return request.post(dbURL, doc)
      .then(() => this.get(doc.sharedId, doc.language));
    }

    return settings.get().then(({languages}) => {
      let sharedId = ID();
      const docs = languages.map((lang) => {
        let langDoc = Object.assign({}, doc);
        langDoc.language = lang.key;
        langDoc.sharedId = sharedId;
        return langDoc;
      });

      return request.post(`${dbURL}/_bulk_docs`, {docs})
      .then(() => this.get(sharedId, language));
    });
  },

  get(sharedId, language) {
    return request.get(`${dbURL}/_design/pages/_view/by_language`, {key: [sharedId, language]})
    .then((response) => {
      return sanitizeResponse(response.json).rows[0];
    });
  },

  list(language) {
    let url = `${dbURL}/_design/pages/_view/list?key="${language}"`;
    return request.get(url)
    .then((response) => {
      return sanitizeResponse(response.json);
    });
  },

  delete(sharedId) {
    return request.get(`${dbURL}/_design/pages/_view/sharedId?key="${sharedId}"`)
    .then((response) => {
      let pages = response.json.rows.map((page) => {
        return {_id: page.value._id, _rev: page.value._rev, _deleted: true};
      });

      return request.post(`${dbURL}/_bulk_docs`, {docs: pages});
    })
    .then((response) => {
      return response.json;
    });
  }
};
