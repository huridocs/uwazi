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
    doc.type = doc.type || 'entity';
    if (!doc._id) {
      doc.user = user;
      doc.creationDate = date.currentUTC();
    }

    const sharedId = doc.sharedId || ID();
    return settings.get()
    .then(({languages}) => {
      if (doc._id) {
        return this.getAllLanguages(doc.sharedId)
        .then((docLanguages) => {
          const docs = docLanguages.rows.map((d) => {
            if (d._id === doc._id) {
              return doc;
            }
            if (!d.metadata) {
              d.metadata = doc.metadata;
            }
            d.published = doc.published;
            d.template = doc.template;
            return d;
          });
          return Promise.all(docs.map(d => request.post(dbURL + '/_design/entities/_update/partialUpdate/' + d._id, d)));
        }).then(docs => docs.find(d => d.language === language));
      }

      const docs = languages.map((lang) => {
        let langDoc = Object.assign({}, doc);
        langDoc.language = lang.key;
        langDoc.sharedId = sharedId;
        return langDoc;
      });

      return request.post(`${dbURL}/_bulk_docs`, {docs});
    })
    .then(() => this.get(sharedId, language))
    .then(response => {
      return Promise.all([response, references.saveEntityBasedReferences(response.rows[0])]);
    })
    .then(([response]) => response.rows[0]);
  },

  get(id, language) {
    return request.get(`${dbURL}/_design/entities_and_docs/_view/by_language`, {key: [id, language]})
    .then((response) => {
      return sanitizeResponse(response.json);
    });
  },

  saveMultiple(docs) {
    return request.post(`${dbURL}/_bulk_docs`, {docs});
  },

  getAllLanguages(id) {
    return request.get(`${dbURL}/_design/entities_and_docs/_view/sharedId?key="${id}"`)
    .then((response) => {
      return sanitizeResponse(response.json);
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

  getByTemplate(templateId, language) {
    return request.get(`${dbURL}/_design/entities/_view/by_template`, {key: [templateId, language]})
    .then((response) => {
      return sanitizeResponse(response.json).rows;
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
    let docs = [];
    return request.get(`${dbURL}/_design/entities_and_docs/_view/sharedId?key="${id}"`)
    .then((response) => {
      docs = sanitizeResponse(response.json).rows;
      docs.forEach((doc) => docsToDelete.push({_id: doc._id, _rev: doc._rev}));
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
    .then(() => {
      return docs;
    });
  }
};
