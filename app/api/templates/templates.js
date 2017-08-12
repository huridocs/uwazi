import {db_url as dbURL} from '../config/database.js';
import request from 'shared/JSONRequest.js';
import {generateNamesAndIds, getUpdatedNames, getDeletedProperties} from './utils';
import validateTemplate from 'api/templates/validateTemplate';
import translations from 'api/i18n/translations';
import instanceModel from 'api/odm';
import templatesModel from './templatesModel.js';
import references from 'api/references/references';
import entities from 'api/entities';

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

  return translations.addContext(template._id, template.name, values, template.isEntity ? 'Entity' : 'Document');
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
      .then((currentTemplate) => Promise.all([currentTemplate, updateTranslation(currentTemplate, template)]))
      .then(([currentTemplate]) => {
        currentTemplate.properties = currentTemplate.properties || [];
        const currentTemplateContentProperties = currentTemplate.properties.filter(p => p.content);
        const templateContentProperties = template.properties.filter(p => p.content);
        const toRemoveValues = {};
        currentTemplateContentProperties.forEach((prop) => {
          let sameProperty = templateContentProperties.find(p => p.id === prop.id);
          if (sameProperty && sameProperty.content !== prop.content) {
            toRemoveValues[sameProperty.name] = prop.type === 'multiselect' ? [] : '';
          }
        });
        if (Object.keys(toRemoveValues).length === 0) {
          return;
        }
        return entities.removeValuesFromEntities(toRemoveValues, currentTemplate._id);
      })
      .then(() => entities.updateMetadataProperties(template))
      .then(() => references.updateMetadataConnections(template))
      .then(() => save(template));
    }

    return save(template)
    .then((newTemplate) => {
      return addTemplateTranslation(newTemplate)
      .then(() => newTemplate);
    });
  },

  get(query) {
    return model.get(query);
  },

  getById(templateId) {
    return model.getById(templateId);
  },

  delete(template) {
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
    .then(() => {
      return template;
    });
  },

  countByTemplate(template) {
    return entities.countByTemplate(template);
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
