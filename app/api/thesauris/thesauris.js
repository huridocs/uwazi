import request from '../../shared/JSONRequest.js';
import {db_url as dbUrl} from '../config/database.js';
import sanitizeResponse from 'api/utils/sanitizeResponse.js';
import entities from 'api/entities/entities';
import translations from 'api/i18n/translations';
import {generateIds, getUpdatedNames, getDeletedProperties} from 'api/templates/utils';

let autoincrementValuesId = (thesauri) => {
  thesauri.values = generateIds(thesauri.values);
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

function _save(thesauri) {
  let context = thesauri.values.reduce((ctx, value) => {
    ctx[value.label] = value.label;
    return ctx;
  }, {});
  context[thesauri.name] = thesauri.name;

  return request.post(dbUrl, thesauri)
  .then((response) => {
    translations.addContext(response.json.id, thesauri.name, context);
    return response;
  });
}

let updateTranslation = (current, thesauri) => {
  let currentProperties = current.values;
  let newProperties = thesauri.values;

  let updatedLabels = getUpdatedNames(currentProperties, newProperties, 'label');
  if (current.name !== thesauri.name) {
    updatedLabels[current.name] = thesauri.name;
  }
  let deletedPropertiesByLabel = getDeletedProperties(currentProperties, newProperties, 'label');
  let context = thesauri.values.reduce((ctx, prop) => {
    ctx[prop.label] = prop.label;
    return ctx;
  }, {});

  context[thesauri.name] = thesauri.name;

  translations.updateContext(current._id, thesauri.name, updatedLabels, deletedPropertiesByLabel, context);
};

function _update(thesauri) {
  return request.get(`${dbUrl}/${thesauri._id}`)
  .then((response) => {
    updateTranslation(response.json, thesauri);
    return request.post(dbUrl, thesauri);
  });
}

export default {
  save(thesauri) {
    thesauri.type = 'thesauri';
    thesauri.values = thesauri.values || [];

    autoincrementValuesId(thesauri);

    return checkDuplicated(thesauri)
    .then(() => {
      if (thesauri._id) {
        return _update(thesauri);
      }
      return _save(thesauri);
    })
    .then((response) => {
      return this.dictionaries(response.json.id).then(t => t.rows[0]);
    })
    .catch((error) => {
      return {error: error.json};
    });
  },

  templateToThesauri(template, language) {
    return entities.getByTemplate(template._id, language)
    .then((response) => {
      template.values = response.map((entity) => {
        return {id: entity.sharedId, label: entity.title, icon: entity.icon};
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
    return translations.deleteContext(thesauriId)
    .then(() => request.delete(`${dbUrl}/${thesauriId}`, {rev}))
    .then((response) => {
      return response.json;
    })
    .catch((error) => {
      return {error: error.json};
    });
  }
};
