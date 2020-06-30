/** @format */
import { DBHOST as dbHost } from 'api/config/database.js';
import entities from 'api/entities';
import translations from 'api/i18n/translations';
import createError from 'api/utils/Error';
import request from 'shared/JSONRequest.js';

import { validateTemplate } from '../../shared/types/templateSchema';
import model from './templatesModel';
import { generateNamesAndIds, getDeletedProperties, getUpdatedNames } from './utils';

const removePropsWithNonexistentId = async nonexistentId => {
  const relatedTemplates = await model.get({ 'properties.content': nonexistentId });
  await Promise.all(
    relatedTemplates.map(t =>
      model.save({
        ...t,
        properties: t.properties.filter(prop => prop.content !== nonexistentId),
      })
    )
  );
};

const createTranslationContext = template => {
  const titleProperty = template.commonProperties.find(p => p.name === 'title');
  const context = template.properties.reduce((ctx, prop) => {
    ctx[prop.label] = prop.label;
    return ctx;
  }, {});
  context[template.name] = template.name;
  context[titleProperty.label] = titleProperty.label;
  return context;
};

const addTemplateTranslation = template => {
  const context = createTranslationContext(template);
  return translations.addContext(template._id, template.name, context, 'Entity');
};

const updateTranslation = (currentTemplate, template) => {
  const currentProperties = currentTemplate.properties;
  const newProperties = template.properties;
  const updatedLabels = getUpdatedNames(currentProperties, newProperties, 'label');
  if (currentTemplate.name !== template.name) {
    updatedLabels[currentTemplate.name] = template.name;
  }
  const deletedPropertiesByLabel = getDeletedProperties(currentProperties, newProperties, 'label');
  const context = createTranslationContext(template);

  return translations.updateContext(
    currentTemplate._id,
    template.name,
    updatedLabels,
    deletedPropertiesByLabel,
    context,
    'Entity'
  );
};

export default {
  async save(template, language) {
    /* eslint-disable no-param-reassign */
    template.properties = template.properties || [];
    template.properties = generateNamesAndIds(template.properties);
    /* eslint-enable no-param-reassign */

    await validateTemplate(template);

    if (template._id) {
      return this._update(template, language);
    }
    return model
      .save(template)
      .then(newTemplate => addTemplateTranslation(newTemplate).then(() => newTemplate));
  },

  _update(template, language) {
    let _currentTemplate;
    return this.getById(template._id)
      .then(currentTemplate => {
        currentTemplate.properties = currentTemplate.properties || []; // eslint-disable-line no-param-reassign
        currentTemplate.properties.forEach(prop => {
          const swapingNameWithExistingProperty = template.properties.find(
            p => p.name === prop.name && p.id !== prop.id
          );
          if (swapingNameWithExistingProperty) {
            throw createError(`Properties can't swap names: ${prop.name}`, 400);
          }
        });

        return currentTemplate;
      })
      .then(currentTemplate =>
        Promise.all([currentTemplate, updateTranslation(currentTemplate, template)])
      )
      .then(([currentTemplate]) => {
        _currentTemplate = currentTemplate;
        const currentTemplateContentProperties = currentTemplate.properties.filter(p => p.content);
        const templateContentProperties = template.properties.filter(p => p.content);

        const toRemoveValues = currentTemplateContentProperties
          .map(prop => {
            const sameProperty = templateContentProperties.find(p => p.id === prop.id);
            if (sameProperty && sameProperty.content !== prop.content) {
              return sameProperty.name;
            }
            return null;
          })
          .filter(v => v);

        if (toRemoveValues.length === 0) {
          return;
        }
        return entities.removeValuesFromEntities(toRemoveValues, currentTemplate._id); // eslint-disable-line consistent-return
      })
      .then(() => model.save(template))
      .then(savedTemplate =>
        entities
          .updateMetadataProperties(template, _currentTemplate, language)
          .then(() => savedTemplate)
      );
  },

  async canDeleteProperty(template, property) {
    const tmps = await model.get();

    return tmps.every(iteratedTemplate =>
      iteratedTemplate.properties.every(
        iteratedProperty =>
          !iteratedProperty.content ||
          !iteratedProperty.inheritProperty ||
          !(
            iteratedProperty.content.toString() === template.toString() &&
            iteratedProperty.inheritProperty.toString() === property.toString()
          )
      )
    );
  },

  _validateSwapPropertyNames(currentTemplate, template) {
    currentTemplate.properties.forEach(prop => {
      const swapingNameWithExistingProperty = template.properties.find(
        p => p.name === prop.name && p.id !== prop.id
      );
      if (swapingNameWithExistingProperty) {
        throw createError(`Properties can't swap names: ${prop.name}`, 400);
      }
    });
  },

  get(query) {
    return model.get(query);
  },

  setAsDefault(templateId) {
    return this.get().then(_templates => {
      const templateToBeDefault = _templates.find(t => t._id.toString() === templateId);
      const currentDefault = _templates.find(t => t.default);
      templateToBeDefault.default = true;
      let saveCurrentDefault = Promise.resolve();
      if (currentDefault) {
        currentDefault.default = false;
        saveCurrentDefault = this.save(currentDefault);
      }
      return Promise.all([this.save(templateToBeDefault), saveCurrentDefault]);
    });
  },

  getById(templateId) {
    return model.getById(templateId);
  },

  async delete(template) {
    const count = await this.countByTemplate(template._id);
    if (count > 0) {
      return Promise.reject({ key: 'documents_using_template', value: count }); // eslint-disable-line prefer-promise-reject-errors
    }
    await translations.deleteContext(template._id);
    await removePropsWithNonexistentId(template._id);
    await model.delete(template._id);

    return template;
  },

  countByTemplate(template) {
    return entities.countByTemplate(template);
  },

  getEntitySelectNames(templateId) {
    return this.getById(templateId).then(template => {
      const selects = template.properties.filter(
        prop => prop.type === 'select' || prop.type === 'multiselect'
      );
      const entitySelects = [];
      return Promise.all(
        selects.map(select =>
          request.get(`${dbHost}/${select.content}`).then(result => {
            if (result.json.type === 'template') {
              entitySelects.push(select.name);
            }
          })
        )
      ).then(() => entitySelects);
    });
  },

  countByThesauri(thesauriId) {
    return model.count({ 'properties.content': thesauriId });
  },
};
