import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';
import sanitizeResponse from 'api/utils/sanitizeResponse';

let normalizeConnection = (connection, docId) => {
  connection.targetRange = connection.targetRange || {text: ''};
  connection.sourceRange = connection.sourceRange || {text: ''};
  connection.inbound = connection.targetDocument === docId;
  connection.range = connection.inbound ? connection.targetRange : connection.sourceRange;
  connection.text = connection.inbound ? connection.sourceRange.text : connection.targetRange.text;
  connection.connectedDocument = connection.inbound ? connection.sourceDocument : connection.targetDocument;
  return connection;
};

export default {
  getAll() {
    return request.get(`${dbURL}/_design/references/_view/all`)
    .then((response) => {
      return sanitizeResponse(response.json);
    });
  },

  getByDocument(docId) {
    return request.get(`${dbURL}/_design/references/_view/by_document?key="${docId}"`)
    .then((response) => {
      return sanitizeResponse(response.json).rows.map((connection) => normalizeConnection(connection, docId));
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

  save(connection) {
    connection.type = 'reference';
    return request.post(dbURL, connection)
    .then((result) => {
      return request.get(`${dbURL}/${result.json.id}`);
    })
    .then((result) => {
      return normalizeConnection(result.json, connection.sourceDocument);
    });
  },

  delete(reference) {
    return request.delete(`${dbURL}/${reference._id}`, {rev: reference._rev})
    .then((result) => {
      return result.json;
    });
  }
};
