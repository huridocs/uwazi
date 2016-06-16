import request from '../../shared/JSONRequest.js';
import {db_url as dbUrl} from '../config/database.js';
import sanitizeResponse from 'api/utils/sanitizeResponse.js';

let autoincrementValuesId = (thesauri) => {
  let nextId = thesauri.values.reduce((latestId, value) => {
    return value.id >= latestId ? value.id : latestId;
  }, 0) + 1;

  thesauri.values.map((value) => {
    if (!value.id) {
      value.id = nextId;
      nextId += 1;
    }
    return value;
  });

  return thesauri;
};

let checkDuplicated = (thesauri) => {
  let url = `${dbUrl}/_design/thesauris/_view/all`;
  return request.get(url)
  .then((response) => {
    let duplicated = response.json.rows.find((entry) => {
      let sameEntity = entry.id === thesauri._id;
      let sameName = entry.value.name.trim().toLowerCase() === thesauri.name.trim().toLowerCase();
      return sameName && !sameEntity;
    });

    if (duplicated) {
      return Promise.reject({json: 'duplicated_entry'});
    }
  });
};

export default {
  save(thesauri) {
    thesauri.type = 'thesauri';
    thesauri.values = thesauri.values || [];

    autoincrementValuesId(thesauri);

    return checkDuplicated(thesauri)
    .then(() => {
      return request.post(dbUrl, thesauri);
    })
    .then((response) => {
      return response.json;
    })
    .catch((error) => {
      return {error: error.json};
    });
  },

  get(thesauriId) {
    let url = `${dbUrl}/_design/thesauris/_view/all`;
    if (thesauriId) {
      url += `?key="${thesauriId}"`;
    }

    return request.get(url)
    .then((response) => {
      return sanitizeResponse(response.json);
    })
    .catch((error) => {
      return {error: error.json};
    });
  },

  delete(thesauriId, rev) {
    return request.delete(`${dbUrl}/${thesauriId}`, {rev})
    .then((response) => {
      return response.json;
    })
    .catch((error) => {
      return {error: error.json};
    });
  }
};
