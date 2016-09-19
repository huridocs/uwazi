import {db_url as dbURL} from '../config/database.js';
import request from 'shared/JSONRequest.js';
import {generateNamesAndIds, getUpdatedNames, getDeletedProperties} from './utils';
import documents from 'api/documents/documents';
import validateTemplate from 'api/templates/validateTemplate';

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

let save = (template) => {
  return checkDuplicated(template)
  .then(() => validateTemplate(template))
  .then(() => request.post(dbURL, template))
  .then((response) => {
    return response.json;
  });
};

let update = (template) => {
  return request.get(`${dbURL}/${template._id}`)
  .then((response) => {
    let currentProperties = response.json.properties;
    let newProperties = template.properties;
    let updatedNames = getUpdatedNames(currentProperties, newProperties);
    let deletedProperties = getDeletedProperties(currentProperties, newProperties);
    return documents.updateMetadataProperties(template._id, updatedNames, deletedProperties);
  })
  .then(() => save(template));
};

export default {
  save(template) {
    template.type = 'template';
    template.properties = template.properties || [];
    template.properties = generateNamesAndIds(template.properties);

    if (template._id) {
      return update(template);
    }

    return save(template);
  },

  delete(template) {
    let url = `${dbURL}/${template._id}?rev=${template._rev}`;

    return documents.countByTemplate(template._id)
    .then((count) => {
      if (count > 0) {
        return Promise.reject({key: 'documents_using_template', value: count});
      }

      return request.delete(url);
    })
    .then((response) => {
      return response.json;
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
