import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';
import sanitizeResponse from 'api/utils/sanitizeResponse';

export default {
  getAll() {
    return request.get(`${dbURL}/_design/relationtypes/_view/all`)
    .then((result) => {
      return sanitizeResponse(result.json).rows;
    });
  },

  getById(id) {
    return request.get(`${dbURL}/${id}`)
    .then((result) => result.json);
  },

  save(relationtype) {
    relationtype.type = 'relationtype';
    return request.post(dbURL, relationtype)
    .then(response => request.get(`${dbURL}/${response.json.id}`))
    .then(response => response.json);
  },

  delete(relationtype) {
    return request.get(`${dbURL}/_design/references/_view/all`)
    .then((result) => {
      let itsBeenUse = result.json.rows.find((row) => {
        return row.value.relation === relationtype._id;
      });

      if (!itsBeenUse) {
        return request.delete(`${dbURL}/${relationtype._id}`, {rev: relationtype._rev})
        .then(() => true);
      }

      return false;
    });
  }
};
