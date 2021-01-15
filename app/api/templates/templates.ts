import entities from 'api/entities';
import translations from 'api/i18n/translations';
import createError from 'api/utils/Error';
import { TemplateSchema } from 'shared/types/templateType';
import { PropertySchema } from 'shared/types/commonTypes';
import { updateMapping } from 'api/search/entitiesIndex';
import { tenants } from 'api/tenants/tenantContext';
import { ensure } from 'shared/tsUtils';
import { ObjectID } from 'mongodb';

import { validateTemplate } from '../../shared/types/templateSchema';
import model from './templatesModel';
import { generateNamesAndIds, getDeletedProperties, getUpdatedNames } from './utils';

const removePropsWithNonexistentId = async (nonexistentId: string) => {
  const relatedTemplates = await model.get({ 'properties.content': nonexistentId });
  await Promise.all(
    relatedTemplates.map(async t =>
      model.save({
        ...t,
        properties: (t.properties || []).filter(prop => prop.content !== nonexistentId),
      })
    )
  );
};

const createTranslationContext = (template: TemplateSchema) => {
  const titleProperty = ensure<PropertySchema>(
    ensure<PropertySchema[]>(template.commonProperties).find(p => p.name === 'title')
  );

  const context = (template.properties || []).reduce<{ [k: string]: string }>((ctx, prop) => {
    ctx[prop.label] = prop.label;
    return ctx;
  }, {});

  context[template.name] = template.name;
  context[titleProperty.label] = titleProperty.label;
  return context;
};

const addTemplateTranslation = async (template: TemplateSchema) =>
  translations.addContext(
    template._id,
    template.name,
    createTranslationContext(template),
    'Entity'
  );

const updateTranslation = async (currentTemplate: TemplateSchema, template: TemplateSchema) => {
  const currentProperties = currentTemplate.properties;
  const newProperties = template.properties || [];
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
  async save(template: TemplateSchema, language: string, reindex = true) {
    /* eslint-disable no-param-reassign */
    template.properties = template.properties || [];
    template.properties = await generateNamesAndIds(template.properties);
    /* eslint-enable no-param-reassign */

    await validateTemplate(template);

    await this.swapNamesValidation(template);

    if (reindex) {
      await updateMapping([template], tenants.current().indexName);
    }

    if (template._id) {
      return this._update(template, language, reindex);
    }

    return model
      .save(template)
      .then(async newTemplate => addTemplateTranslation(newTemplate).then(() => newTemplate));
  },

  async swapNamesValidation(template: TemplateSchema) {
    if (!template._id) {
      return;
    }
    const current = await this.getById(ensure(template._id));

    const currentTemplate = ensure<TemplateSchema>(current);
    currentTemplate.properties = currentTemplate.properties || [];
    currentTemplate.properties.forEach(prop => {
      const swapingNameWithExistingProperty = (template.properties || []).find(
        p => p.name === prop.name && p.id !== prop.id
      );
      if (swapingNameWithExistingProperty) {
        throw createError(`Properties can't swap names: ${prop.name}`, 400);
      }
    });
  },

  async _update(template: TemplateSchema, language: string, reindex = true) {
    let _currentTemplate: TemplateSchema;
    return this.getById(ensure(template._id))
      .then(async current => {
        const currentTemplate = ensure<TemplateSchema>(current);
        return Promise.all([currentTemplate, updateTranslation(currentTemplate, template)]);
      })
      .then(([current]) => {
        const currentTemplate = ensure<TemplateSchema>(current);
        _currentTemplate = currentTemplate;
        const currentTemplateContentProperties = (currentTemplate.properties || []).filter(
          p => p.content
        );
        const templateContentProperties = (template.properties || []).filter(p => p.content);

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
      .then(async () => model.save(template))
      .then(async savedTemplate =>
        entities
          .updateMetadataProperties(template, _currentTemplate, language, reindex)
          .then(() => savedTemplate)
      );
  },

  async canDeleteProperty(template: ObjectID, property: ObjectID | string | undefined) {
    const tmps = await model.get();
    return tmps.every(iteratedTemplate =>
      (iteratedTemplate.properties || []).every(
        iteratedProperty =>
          !iteratedProperty.content ||
          !iteratedProperty.inheritProperty ||
          !(
            iteratedProperty.content.toString() === template.toString() &&
            iteratedProperty.inheritProperty.toString() === (property || '').toString()
          )
      )
    );
  },

  _validateSwapPropertyNames(currentTemplate: TemplateSchema, template: TemplateSchema) {
    (currentTemplate.properties || []).forEach(prop => {
      const swapingNameWithExistingProperty = (template.properties || []).find(
        p => p.name === prop.name && p.id !== prop.id
      );
      if (swapingNameWithExistingProperty) {
        throw createError(`Properties can't swap names: ${prop.name}`, 400);
      }
    });
  },

  async get(query: any = {}) {
    return model.get(query);
  },

  async setAsDefault(_id: string) {
    const [templateToBeDefault] = await this.get({ _id });
    const [currentDefault] = await this.get({ _id: { $nin: [_id] }, default: true });

    if (templateToBeDefault) {
      let saveCurrentDefault = Promise.resolve({});
      if (currentDefault) {
        saveCurrentDefault = model.save({
          _id: currentDefault._id,
          default: false,
        });
      }
      return Promise.all([model.save({ _id, default: true }), saveCurrentDefault]);
    }

    throw createError('Invalid ID');
  },

  async getById(templateId: ObjectID | string) {
    return model.getById(templateId);
  },

  async delete(template: TemplateSchema) {
    const count = await this.countByTemplate(ensure(template._id));
    if (count > 0) {
      return Promise.reject({ key: 'documents_using_template', value: count }); // eslint-disable-line prefer-promise-reject-errors
    }
    const _id = ensure<string>(template._id);
    await translations.deleteContext(_id);
    await removePropsWithNonexistentId(_id);
    await model.delete(_id);

    return template;
  },

  async countByTemplate(template: string) {
    return entities.countByTemplate(template);
  },

  async countByThesauri(thesauriId: string) {
    return model.count({ 'properties.content': thesauriId });
  },
};
