import {db_url as dbURL} from '../config/database.js';
import request from 'shared/JSONRequest.js';
import {generateNamesAndIds, getUpdatedNames, getDeletedProperties} from './utils';
import validateTemplate from 'api/templates/validateTemplate';
import translations from 'api/i18n/translations';
import instanceModel from 'api/odm';
import templatesModel from './templatesModel.js';

const model = instanceModel(templatesModel);

let checkDuplicated = (template) => {
  return model.get()
  .then((templates) => {
    let duplicated = templates.find((entry) => {
      let sameEntity = entry._id.equals(template._id);
      let sameName = entry.name.trim().toLowerCase() === template.name.trim().toLowerCase();
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

  return translations.addContext(template._id, template.name, values);
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

  return translations.updateContext(currentTemplate._id, template.name, updatedLabels, deletedPropertiesByLabel, context);
};

let save = (template) => {
  return checkDuplicated(template)
  .then(() => validateTemplate(template))
  .then(() => {
    return model.save(template);
  });
};

export default {
  save(template) {
    template.properties = template.properties || [];
    template.properties = generateNamesAndIds(template.properties);

    if (template._id) {
      return this.getById(template._id)
      .then((currentTemplate) => updateTranslation(currentTemplate, template))
      .then(() => save(template));
    }

    return save(template)
    .then((newTemplate) => {
      //maybe this is not a good idea (having an unhandled async process)
      return addTemplateTranslation(newTemplate)
      .then(() => newTemplate);
      //
      //return newTemplate;
    });
  },

  get(query) {
    return model.get(query);
  },

  getById(templateId) {
    return model.getById(templateId);
  },

  /// MAL !! deberia hacer un count de documents y entitites ??? revisar
  delete(template) {
    let url = `${dbURL}/${template._id}?rev=${template._rev}`;

    return this.countByTemplate(template._id)
    .then((count) => {
      if (count > 0) {
        return Promise.reject({key: 'documents_using_template', value: count});
      }
      return translations.deleteContext(template._id);
    })
    .then(() => {
      return model.delete(template._id);
    })
    .then((response) => {
      return {ok: true};
    });
  },

  countByTemplate(templateId) {
    return Promise.resolve(0);
    //return request.get(`${dbURL}/_design/documents/_view/count_by_template?group_level=1&key="${templateId}"`)
    //.then((response) => {
      //if (!response.json.rows.length) {
        //return 0;
      //}
      //return response.json.rows[0].value;
    //});
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
    return model.count({'properties.content': thesauriId});
  }
};
