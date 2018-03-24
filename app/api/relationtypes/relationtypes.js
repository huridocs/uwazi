import relationships from 'api/relationships/relationships';
import translations from 'api/i18n/translations';

import { generateNamesAndIds, getUpdatedNames, getDeletedProperties } from '../templates/utils';
import model from './model';

const checkDuplicated = relationtype => model.get()
.then((response) => {
  const duplicated = response.find((entry) => {
    const sameEntity = entry._id.equals(relationtype._id);
    const sameName = entry.name.trim().toLowerCase() === relationtype.name.trim().toLowerCase();
    return sameName && !sameEntity;
  });

  if (duplicated) {
    return Promise.reject('duplicated_entry');
  }
});

function _save(relationtype) {
  const values = {};
  values[relationtype.name] = relationtype.name;
  relationtype.properties.forEach((property) => {
    values[property.label] = property.label;
  });
  return model.save(relationtype)
  .then(response => translations.addContext(response._id, relationtype.name, values, 'Connection')
  .then(() => response));
}

const updateTranslation = (currentTemplate, template) => {
  const currentProperties = currentTemplate.properties;
  const newProperties = template.properties;

  const updatedLabels = getUpdatedNames(currentProperties, newProperties, 'label');
  if (currentTemplate.name !== template.name) {
    updatedLabels[currentTemplate.name] = template.name;
  }
  const deletedPropertiesByLabel = getDeletedProperties(currentProperties, newProperties, 'label');
  const context = template.properties.reduce((ctx, prop) => {
    ctx[prop.label] = prop.label;
    return ctx;
  }, {});

  context[template.name] = template.name;

  return translations.updateContext(currentTemplate._id, template.name, updatedLabels, deletedPropertiesByLabel, context);
};

function _update(newTemplate) {
  return model.getById({ _id: newTemplate._id })
  .then((currentTemplate) => {
    updateTranslation(currentTemplate, newTemplate);
    relationships.updateMetadataProperties(newTemplate, currentTemplate);
    return model.save(newTemplate);
  });
}

export default {
  get(query) {
    return model.get(query);
  },

  getById(id) {
    return model.getById(id);
  },

  save(relationtype) {
    relationtype.properties = generateNamesAndIds(relationtype.properties || []);

    return checkDuplicated(relationtype)
    .then(() => {
      if (!relationtype._id) {
        return _save(relationtype);
      }
      return _update(relationtype);
    });
  },

  delete(id) {
    return relationships.countByRelationType(id)
    .then((relationshipsUsingIt) => {
      if (relationshipsUsingIt === 0) {
        return translations.deleteContext(id)
        .then(() => model.delete(id))
        .then(() => true);
      }

      return false;
    });
  }
};
