import {db_url as dbUrl} from 'api/config/database';
import request from 'shared/JSONRequest';
import sanitizeResponse from 'api/utils/sanitizeResponse';
import references from 'api/references/references';
import translations from 'api/i18n/translations';

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

function _save(relationtype) {
  let values = {};
  values[relationtype.name] = relationtype.name;
  return request.post(dbUrl, relationtype)
  .then((response) => {
    return translations.addContext(response.json.id, relationtype.name, values)
    .then(() => {
      return response;
    });
  });
}

function updateTranslation(id, oldName, newName) {
  let updatedNames = {};
  updatedNames[oldName] = newName;
  let values = {};
  values[newName] = newName;
  return translations.updateContext(id, newName, updatedNames, [], values);
}

function _update(relationtype) {
  return request.get(`${dbUrl}/${relationtype._id}`)
  .then((response) => {
    updateTranslation(relationtype._id, response.json.name, relationtype.name);
    return request.post(dbUrl, relationtype);
  });
}

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
      if (!relationtype._id) {
        return _save(relationtype);
      }
      return _update(relationtype);
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
        return translations.deleteContext(relationtype._id)
        .then(() => request.delete(`${dbUrl}/${relationtype._id}`, {rev: relationtype._rev}))
        .then(() => true);
      }

      return false;
    }).catch(console.log);
  }
};
