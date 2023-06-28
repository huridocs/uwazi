import translations from 'api/i18n/translations';
import relationships from 'api/relationships/relationships';
import templates from 'api/templates';
import { createError } from 'api/utils';
import { ContextType } from 'shared/translationSchema';
import { generateNames, getUpdatedNames, getDeletedProperties } from '../templates/utils';
import model from './model';
import * as v2 from './v2_support';

const checkDuplicated = relationtype =>
  model.get().then(response => {
    const duplicated = response.find(entry => {
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
  relationtype.properties.forEach(property => {
    values[property.label] = property.label;
  });
  return model
    .save(relationtype)
    .then(response =>
      translations
        .addContext(response._id, relationtype.name, values, ContextType.relationshipType)
        .then(() => response)
    );
}

const updateTranslation = (currentTemplate, template) => {
  const currentProperties = currentTemplate.properties;
  const newProperties = template.properties;

  const updatedLabels = getUpdatedNames(
    {
      prop: 'label',
      outKey: 'label',
      filterBy: '_id',
    },
    currentProperties,
    newProperties
  );
  if (currentTemplate.name !== template.name) {
    updatedLabels[currentTemplate.name] = template.name;
  }
  const deletedPropertiesByLabel = getDeletedProperties(
    currentProperties,
    newProperties,
    '_id',
    'label'
  );
  const context = template.properties.reduce((ctx, prop) => {
    ctx[prop.label] = prop.label;
    return ctx;
  }, {});

  context[template.name] = template.name;

  return translations.updateContext(
    { id: currentTemplate._id.toString(), label: template.name, type: 'Connection' },
    updatedLabels,
    deletedPropertiesByLabel,
    context
  );
};

function _update(newTemplate) {
  return model.getById({ _id: newTemplate._id }).then(currentTemplate => {
    updateTranslation(currentTemplate, newTemplate);
    relationships.updateMetadataProperties(newTemplate, currentTemplate);
    return model.save(newTemplate);
  });
}

async function validateTypeInTemplates(id) {
  const templatesUsingType = await templates.findUsingRelationTypeInProp(id);
  if (templatesUsingType.length > 0) {
    const templatesNames = templatesUsingType.map(t => t.name).join(', ');
    throw createError(`Cannot delete type being used in templates: ${templatesNames}`, 400);
  }
}

export default {
  get(query) {
    return model.get(query);
  },

  getById(id) {
    return model.getById(id);
  },

  async save(relationtype) {
    relationtype.properties = await generateNames(relationtype.properties || []);

    return checkDuplicated(relationtype).then(() => {
      if (!relationtype._id) {
        return _save(relationtype);
      }
      return _update(relationtype);
    });
  },

  async delete(id) {
    await validateTypeInTemplates(id);

    const connectionCount = await relationships.countByRelationType(id);
    const newRelationshipCount = await v2.getNewRelationshipCount(id);
    const relationTypeIsUsedInQueries = await v2.relationTypeIsUsedInQueries(id);

    if (connectionCount === 0 && newRelationshipCount === 0 && !relationTypeIsUsedInQueries) {
      await translations.deleteContext(id);
      await model.delete(id);
      return true;
    }

    return false;
  },
};
