import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';
import date from 'api/utils/date.js';
import sanitizeResponse from '../utils/sanitizeResponse';
import ID from 'shared/uniqueID';
import settings from '../settings';

import model from './pagesModel';

export default {
  save(doc, user, language) {
    if (!doc._id) {
      doc.user = user;
      doc.creationDate = date.currentUTC();
    }

    if (doc.sharedId) {
      return model.save(doc);
    }

    return settings.get().then(({languages}) => {
      const sharedId = ID();
      const docs = languages.map((lang) => {
        const langDoc = Object.assign({}, doc);
        langDoc.language = lang.key;
        langDoc.sharedId = sharedId;
        return langDoc;
      });

      return model.save(docs)
      .then((result) => this.getById(sharedId, language));
    });
  },

  get(query) {
    return model.get(query);
  },

  getById(sharedId, language) {
    return this.get({sharedId, language}).then(results => results[0]);
  },

  list(language) {
    const url = `${dbURL}/_design/pages/_view/list?key="${language}"`;
    return request.get(url)
    .then((response) => {
      return sanitizeResponse(response.json);
    });
  },

  delete(sharedId) {
    return model.delete({sharedId});
    return request.get(`${dbURL}/_design/pages/_view/sharedId?key="${sharedId}"`)
    .then((response) => {
      const pages = response.json.rows.map((page) => {
        return {_id: page.value._id, _rev: page.value._rev, _deleted: true};
      });

      return request.post(`${dbURL}/_bulk_docs`, {docs: pages});
    })
    .then((response) => {
      return response.json;
    });
  }
};
