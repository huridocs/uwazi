import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';
import {updateMetadataNames, deleteMetadataProperties} from 'api/entities/utils';
import date from 'api/utils/date.js';
import sanitizeResponse from '../utils/sanitizeResponse';
import fs from 'fs';

export default {
  save(doc, user) {
    doc.type = 'entity';
    if (!doc._id) {
      doc.user = user;
      doc.creationDate = date.currentUTC();
    }

    let url = dbURL;
    if (doc._id) {
      url = dbURL + '/_design/entities/_update/partialUpdate/' + doc._id;
    }

    return request.post(url, doc)
    .then(response => request.get(`${dbURL}/${response.json.id}`))
    .then(response => response.json);
  },

  getUploadsByUser(user) {
    let url = `${dbURL}/_design/entities/_view/uploads?key="${user._id}"&descending=true`;

    return request.get(url)
    .then(response => {
      response.json.rows = response.json.rows.map(row => row.value).sort((a, b) => b.creationDate - a.creationDate);
      return response.json;
    });
  },

  countByTemplate(templateId) {
    return request.get(`${dbURL}/_design/entities/_view/count_by_template?group_level=1&key="${templateId}"`)
    .then((response) => {
      if (!response.json.rows.length) {
        return 0;
      }
      return response.json.rows[0].value;
    });
  },

  updateMetadataProperties(templateId, nameMatches, deleteProperties) {
    return request.get(`${dbURL}/_design/entities/_view/metadata_by_template?key="${templateId}"`)
    .then((response) => {
      let entities = response.json.rows.map((r) => r.value);
      entities = updateMetadataNames(entities, nameMatches);
      entities = deleteMetadataProperties(entities, deleteProperties);

      let updates = [];
      entities.forEach((entity) => {
        let url = `${dbURL}/_design/entities/_update/partialUpdate/${entity._id}`;
        updates.push(request.post(url, entity));
      });

      return Promise.all(updates);
    });
  },

  list(keys) {
    let url = `${dbURL}/_design/entities/_view/list`;
    if (keys) {
      url += `?keys=${JSON.stringify(keys)}`;
    }
    return request.get(url)
    .then((response) => {
      return sanitizeResponse(response.json);
    });
  },

  delete(id) {
    let docsToDelete = [];
    return request.get(`${dbURL}/${id}`)
    .then((response) => {
      docsToDelete.push({_id: response.json._id, _rev: response.json._rev});
      return request.get(`${dbURL}/_design/references/_view/by_source?key="${id}"`);
    })
    .then((response) => {
      sanitizeResponse(response.json);
      docsToDelete = docsToDelete.concat(response.json.rows);
      return request.get(`${dbURL}/_design/references/_view/by_target?key="${id}"`);
    })
    .then((response) => {
      sanitizeResponse(response.json);
      docsToDelete = docsToDelete.concat(response.json.rows);
      docsToDelete.map((doc) => doc._deleted = true);
      return request.post(`${dbURL}/_bulk_docs`, {docs: docsToDelete});
    })
    .then((response) => {
      return response.json;
    });
  }
};
