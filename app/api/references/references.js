import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';
import sanitizeResponse from 'api/utils/sanitizeResponse';

export default {
  getAll() {
    return request.get(`${dbURL}/_design/references/_view/all`)
    .then((response) => {
      return sanitizeResponse(response.json);
    });
  },

  getByDocument(docId) {
    return request.get(`${dbURL}/_design/references/_view/by_source_document?key="${docId}"`)
    .then((response) => {
      return sanitizeResponse(response.json);
    });
  },

  getByTarget(docId) {
    return request.get(`${dbURL}/_design/references/_view/by_target_document?key="${docId}"`)
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

  save(reference) {
    reference.type = 'reference';
    return request.post(dbURL, reference)
    .then((result) => {
      return request.get(`${dbURL}/${result.json.id}`);
    })
    .then((result) => {
      return result.json;
    });
  },

  delete(reference) {
    return request.delete(`${dbURL}/${reference._id}`, {rev: reference._rev})
    .then((result) => {
      return result.json;
    });
  }
};
