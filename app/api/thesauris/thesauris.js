import request from '../../shared/JSONRequest.js';
import {db_url as dbUrl} from '../config/database.js';
import sanitizeResponse from 'api/utils/sanitizeResponse.js';
import entities from 'api/entities/entities';

let autoincrementValuesId = (thesauri) => {
  let nextId = thesauri.values.reduce((latestId, value) => {
    return parseInt(value.id, 10) >= latestId ? parseInt(value.id, 10) : latestId;
  }, 0) + 1;

  thesauri.values.map((value) => {
    if (!value.id) {
      value.id = nextId;
      nextId += 1;
    }

    value.id = value.id.toString();
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

  templateToThesauri(template, language) {
    return entities.getByTemplate(template._id, language)
    .then((response) => {
      template.values = response.map((entity) => {
        return {id: entity._id, label: entity.title, icon: entity.icon};
      });
      return template;
    });
  },

  get(thesauriId, language) {
    let url = `${dbUrl}/_design/thesauris/_view/all`;
    if (thesauriId) {
      url += `?key="${thesauriId}"`;
    }
    return request.get(url)
    .then((response) => {
      let thesauris = sanitizeResponse(response.json);
      let requests = thesauris.rows.map((result, index) => {
        if (result.type === 'template') {
          return this.templateToThesauri(result, language)
          .then((templateTransformedInThesauri) => {
            thesauris.rows[index] = templateTransformedInThesauri;
          });
        }

        return Promise.resolve(result);
      });

      return Promise.all(requests)
      .then(() => {
        return thesauris;
      });
    })
    .catch((error) => {
      return {error: error.json};
    });
  },

  dictionaries(thesauriId) {
    let url = `${dbUrl}/_design/thesauris/_view/dictionaries`;
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
