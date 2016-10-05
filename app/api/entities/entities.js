import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';
import {updateMetadataNames, deleteMetadataProperties} from 'api/entities/utils';
import date from 'api/utils/date.js';
import sanitizeResponse from '../utils/sanitizeResponse';
import references from '../references/references.js';
import settings from '../settings';
import ID from 'shared/uniqueId';

export default {
  save(doc, {user, language}) {
    doc.type = 'entity';
    if (!doc._id) {
      doc.user = user;
      doc.creationDate = date.currentUTC();
    }

    const sharedId = doc.sharedId || ID();
    return settings.get()
    .then(({languages}) => {
      if (doc._id) {
        return request.post(dbURL + '/_design/entities/_update/partialUpdate/' + doc._id, doc);
      }

      const docs = languages.map((lang) => {
        let langDoc = Object.assign({}, doc);
        langDoc.language = lang.key;
        langDoc.sharedId = sharedId;
        return langDoc;
      });

      return request.post(`${dbURL}/_bulk_docs`, {docs});
    })
    .then(() => request.get(`${dbURL}/_design/entities/_view/by_language`, {key: [sharedId, language]}))
    .then(response => {
      return Promise.all([response, references.saveEntityBasedReferences(response.json.rows[0].value)]);
    })
    .then(([response]) => response.json.rows[0].value);
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

  getByTemplate(templateId) {
    return request.get(`${dbURL}/_design/entities/_view/by_template?&key="${templateId}"`)
    .then((response) => {
      return sanitizeResponse(response.json);
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
