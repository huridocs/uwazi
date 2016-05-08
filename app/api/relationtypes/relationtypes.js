import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';
import sanitizeResponse from 'api/utils/sanitizeResponse';
import references from 'api/references/references';

export default {
  getAll() {
    return request.get(`${dbURL}/_design/relationtypes/_view/all`)
    .then((result) => {
      return sanitizeResponse(result.json);
    });
  },

  getById(id) {
    return request.get(`${dbURL}/_design/relationtypes/_view/all?key="${id}"`)
    .then((result) => {
      return sanitizeResponse(result.json);
    });
  },

  save(relationtype) {
    relationtype.type = 'relationtype';
    return request.post(dbURL, relationtype)
    .then(response => request.get(`${dbURL}/${response.json.id}`))
    .then(response => response.json);
  },

  delete(relationtype) {
    return references.countByRelationType(relationtype._id)
    .then((referencesUsingIt) => {
      if (referencesUsingIt === 0) {
        return request.delete(`${dbURL}/${relationtype._id}`, {rev: relationtype._rev})
        .then(() => true);
      }

      return false;
    }).catch(console.log);
  }
};
