import {db_url as dbUrl} from 'api/config/database';
import request from 'shared/JSONRequest';
import sanitizeResponse from 'api/utils/sanitizeResponse';
import references from 'api/references/references';

let checkDuplicated = (relationtype) => {
  let url = `${dbUrl}/_design/relationtypes/_view/all`;
  return request.get(url)
  .then((response) => {
    let duplicated = response.json.rows.find((entry) => {
      let sameEntity = entry.id === relationtype._id;
      let sameName = entry.value.name.trim().toLowerCase() === relationtype.name.trim().toLowerCase();
      return sameName && !sameEntity;
    });

    if (duplicated) {
      return Promise.reject({json: 'duplicated_entry'});
    }
  });
};

export default {
  getAll() {
    return request.get(`${dbUrl}/_design/relationtypes/_view/all`)
    .then((result) => {
      return sanitizeResponse(result.json);
    });
  },

  getById(id) {
    return request.get(`${dbUrl}/_design/relationtypes/_view/all?key="${id}"`)
    .then((result) => {
      return sanitizeResponse(result.json);
    });
  },

  save(relationtype) {
    relationtype.type = 'relationtype';
    return checkDuplicated(relationtype)
    .then(() => {
      return request.post(dbUrl, relationtype);
    })
    .then(response => request.get(`${dbUrl}/${response.json.id}`))
    .then(response => response.json)
    .catch((error) => {
      return {error: error.json};
    });
  },

  delete(relationtype) {
    return references.countByRelationType(relationtype._id)
    .then((referencesUsingIt) => {
      if (referencesUsingIt === 0) {
        return request.delete(`${dbUrl}/${relationtype._id}`, {rev: relationtype._rev})
        .then(() => true);
      }

      return false;
    }).catch(console.log);
  }
};
