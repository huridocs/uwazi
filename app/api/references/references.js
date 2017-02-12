import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';
import sanitizeResponse from 'api/utils/sanitizeResponse';
import templates from 'api/templates';
import entities from 'api/entities';

import instanceModel from 'api/odm';
import connectionsModel from './connectionsModel.js';

const model = instanceModel(connectionsModel);

let normalizeConnection = (connection, docId) => {
  connection.targetRange = connection.targetRange || {text: ''};
  connection.sourceRange = connection.sourceRange || {text: ''};
  connection.inbound = connection.targetDocument === docId;
  connection.range = connection.inbound ? connection.targetRange : connection.sourceRange;
  connection.text = connection.inbound ? connection.sourceRange.text : connection.targetRange.text;
  connection.connectedDocument = connection.inbound ? connection.sourceDocument : connection.targetDocument;
  return connection;
};

let normalizeConnectedDocumentData = (connection, connectedDocument) => {
  connection.connectedDocumentTemplate = connectedDocument.template;
  connection.connectedDocumentType = connectedDocument.type;
  connection.connectedDocumentTitle = connectedDocument.title;
  connection.connectedDocumentIcon = connectedDocument.icon;
  connection.connectedDocumentPublished = Boolean(connectedDocument.published);
  connection.connectedDocumentMetadata = connectedDocument.metadata || {};
  connection.connectedDocumentCreationDate = connectedDocument.creationDate;
  return connection;
};

export default {
  get() {
    return model.get();
  },

  getByDocument(id, language) {
    //return request.get(`${dbURL}/_design/references/_view/by_document?key="${id}"`)
    return model.get({$or: [{targetDocument: id}, {sourceDocument: id}]})
    .then((response) => {
      let connections = response.map((connection) => normalizeConnection(connection, id));
      let requestDocuments = [];
      connections.forEach((connection) => {
        let promise = entities.get(connection.connectedDocument, language)
        .then((connectedDocument) => {
          normalizeConnectedDocumentData(connection, connectedDocument[0]);
        });
        requestDocuments.push(promise);
      });

      return Promise.all(requestDocuments)
      .then(() => {
        return connections;
      });
    });
  },

  getByTarget(docId) {
    return request.get(`${dbURL}/_design/references/_view/by_target?key="${docId}"`)
    .then((response) => {
      return sanitizeResponse(response.json);
    });
  },

  countByRelationType(typeId) {
    return request.get(`${dbURL}/_design/references/_view/count_by_relation_type?key="${typeId}"`)
    .then((response) => {
      if (!response.json.rows.length) {
        return 0;
      }
      return response.json.rows[0].value;
    });
  },

  save(connection, language) {
    connection.type = 'reference';
    return request.post(dbURL, connection)
    .then((result) => {
      return request.get(`${dbURL}/${result.json.id}`);
    })
    .then((result) => {
      return normalizeConnection(result.json, connection.sourceDocument);
    })
    .then((result) => {
      return Promise.all([result, entities.get(result.connectedDocument, language)]);
    })
    .then(([result, connectedDocument]) => {
      return normalizeConnectedDocumentData(result, connectedDocument.rows[0]);
    });
  },

  saveEntityBasedReferences(entity, language) {
    if (!entity.template) {
      return Promise.resolve([]);
    }

    return templates.getById(entity.template)
    .then((template) => {
      const selects = template.properties.filter((prop) => prop.type === 'select' || prop.type === 'multiselect');
      const entitySelects = [];
      return Promise.all(selects.map((select) => {
        return templates.getById(select.content)
        .then((result) => {
          if (result) {
            entitySelects.push(select.name);
          }
        });
      }))
      .then(() => entitySelects);
    })
    .then((properties) => {
      return Promise.all([
        properties,
        this.getByDocument(entity.sharedId, language)
      ]);
    })
    .then(([properties, references]) => {
      let values = properties.reduce((memo, property) => {
        let propertyValues = entity.metadata[property] || [];
        if (typeof propertyValues === 'string') {
          propertyValues = [propertyValues];
        }

        return memo.concat(propertyValues.map(value => {
          return {property, value};
        }));
      }, []);

      const toDelete = references.filter((ref) => {
        let isInValues = false;
        values.forEach((item) => {
          if (item.property === ref.sourceProperty && ref.targetDocument === item.value) {
            isInValues = true;
          }
        });
        return !ref.inbound && !isInValues && ref.sourceType === 'metadata';
      });

      const toCreate = values.filter((item) => {
        let isInReferences = false;
        references.forEach((ref) => {
          if (item.property === ref.sourceProperty && ref.targetDocument === item.value) {
            isInReferences = true;
          }
        });
        return !isInReferences;
      });

      const deletes = toDelete.map((ref) => this.delete(ref));
      const creates = toCreate.map((item) => this.save({
        sourceType: 'metadata',
        sourceDocument: entity.sharedId,
        targetDocument: item.value,
        sourceProperty: item.property
      }, language));

      return Promise.all(deletes.concat(creates));
    });
  },

  delete(reference) {
    return request.delete(`${dbURL}/${reference._id}`, {rev: reference._rev})
    .then((result) => {
      return result.json;
    });
  },

  deleteTextReferences(sharedId, language) {
    return this.getByDocument(sharedId, language)
    .then(connections => {
      const toDelete = connections
      .filter(c => c.language === language && c.range.text.length)
      .map(reference => this.delete(reference));

      return Promise.all(toDelete);
    });
  }
};
