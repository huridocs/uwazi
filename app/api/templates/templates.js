import {db_url as dbURL} from '../config/database.js';
import request from 'shared/JSONRequest.js';
import {generateNamesAndIds, getUpdatedNames, getDeletedProperties} from './utils';
import {updateMetadataNames, deleteMetadataProperties} from 'api/documents/utils';
import validateTemplate from 'api/templates/validateTemplate';
import translations from 'api/i18n/translations';

let checkDuplicated = (template) => {
  return request.get(`${dbURL}/_design/templates/_view/all`)
  .then((response) => {
    let duplicated = response.json.rows.find((entry) => {
      let sameEntity = entry.id === template._id;
      let sameName = entry.value.name.trim().toLowerCase() === template.name.trim().toLowerCase();
      return sameName && !sameEntity;
    });

    if (duplicated) {
      return Promise.reject({json: 'duplicated_entry'});
    }
  });
};

let addTemplateTranslation = (template) => {
  let values = {};
  values[template.name] = template.name;
  template.properties.forEach((property) => {
    values[property.label] = property.label;
  });

  translations.addContext(template._id, template.name, values);
};

let updateTranslation = (currentTemplate, template) => {
  let currentProperties = currentTemplate.properties;
  let newProperties = template.properties;

  let updatedLabels = getUpdatedNames(currentProperties, newProperties, 'label');
  if (currentTemplate.name !== template.name) {
    updatedLabels[currentTemplate.name] = template.name;
  }
  let deletedPropertiesByLabel = getDeletedProperties(currentProperties, newProperties, 'label');
  let context = template.properties.reduce((ctx, prop) => {
    ctx[prop.label] = prop.label;
    return ctx;
  }, {});

  context[template.name] = template.name;

  translations.updateContext(currentTemplate._id, template.name, updatedLabels, deletedPropertiesByLabel, context);
};

let save = (template) => {
  return checkDuplicated(template)
  .then(() => validateTemplate(template))
  .then(() => {
    return request.post(dbURL, template);
  })
  .then((response) => {
    return response.json;
  });
};

export default {
  save(template) {
    template.type = 'template';
    template.properties = template.properties || [];
    template.properties = generateNamesAndIds(template.properties);

    if (template._id) {
      return request.get(`${dbURL}/${template._id}`)
      .then(() => save(template));
    }

    return save(template)
    .then((response) => {
      template._id = response.id;
      addTemplateTranslation(template);
      return this.getById(response.id);
    });
  },

  /// MAL !! deberia hacer un count de documents y entitites ??? revisar
  delete(template) {
    let url = `${dbURL}/${template._id}?rev=${template._rev}`;

    return this.countByTemplate(template._id)
    .then((count) => {
      if (count > 0) {
        return Promise.reject({key: 'documents_using_template', value: count});
      }
      translations.deleteContext(template._id);
      return request.delete(url);
    })
    .then((response) => {
      return response.json;
    });
  },

  countByTemplate(templateId) {
    return request.get(`${dbURL}/_design/documents/_view/count_by_template?group_level=1&key="${templateId}"`)
    .then((response) => {
      if (!response.json.rows.length) {
        return 0;
      }
      return response.json.rows[0].value;
    });
  },

  getById(templateId) {
    const id = '?key="' + templateId + '"';
    const url = dbURL + '/_design/templates/_view/all' + id;

    return request.get(url)
    .then(response => {
      response.json.rows = response.json.rows.map(row => row.value);
      return response.json.rows[0];
    });
  },

  getEntitySelectNames(templateId) {
    return this.getById(templateId)
    .then((template) => {
      const selects = template.properties.filter((prop) => prop.type === 'select' || prop.type === 'multiselect');
      const entitySelects = [];
      return Promise.all(selects.map((select) => {
        return request.get(`${dbURL}/${select.content}`)
        .then((result) => {
          if (result.json.type === 'template') {
            entitySelects.push(select.name);
          }
        });
      }))
      .then(() => entitySelects);
    });
  },

  countByThesauri(thesauriId) {
    return request.get(`${dbURL}/_design/templates/_view/count_by_thesauri?key="${thesauriId}"`)
    .then((response) => {
      if (!response.json.rows.length) {
        return 0;
      }
      return response.json.rows[0].value;
    });
  },

  selectOptions() {
    return request.get(`${dbURL}/_design/templates/_view/select_options`)
    .then((response) => {
      return response.json.rows.map(row => row.value);
    });
  }
};
