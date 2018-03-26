import { generateIds, getUpdatedNames, getDeletedProperties } from 'api/templates/utils';
import entities from 'api/entities/entities';
import templates from 'api/templates/templates';
import translations from 'api/i18n/translations';

import model from './dictionariesModel';

const autoincrementValuesId = (thesauri) => {
  thesauri.values = generateIds(thesauri.values);
  return thesauri;
};

const checkDuplicated = thesauri => model.get()
.then((thesauris) => {
  const duplicated = thesauris.find((entry) => {
    const sameEntity = entry._id.equals(thesauri._id);
    const sameName = entry.name.trim().toLowerCase() === thesauri.name.trim().toLowerCase();
    return sameName && !sameEntity;
  });

  if (duplicated) {
    return Promise.reject('duplicated_entry');
  }
});

function _save(thesauri) {
  const context = thesauri.values.reduce((ctx, value) => {
    ctx[value.label] = value.label;
    return ctx;
  }, {});
  context[thesauri.name] = thesauri.name;

  return model.save(thesauri)
  .then(response => translations.addContext(response._id, thesauri.name, context, 'Dictionary')
  .then(() => response));
}

const updateTranslation = (current, thesauri) => {
  const currentProperties = current.values;
  const newProperties = thesauri.values;

  const updatedLabels = getUpdatedNames(currentProperties, newProperties, 'label');
  if (current.name !== thesauri.name) {
    updatedLabels[current.name] = thesauri.name;
  }
  const deletedPropertiesByLabel = getDeletedProperties(currentProperties, newProperties, 'label');
  const context = thesauri.values.reduce((ctx, prop) => {
    ctx[prop.label] = prop.label;
    return ctx;
  }, {});

  context[thesauri.name] = thesauri.name;

  return translations.updateContext(current._id, thesauri.name, updatedLabels, deletedPropertiesByLabel, context);
};

function _update(thesauri) {
  return model.getById(thesauri._id)
  .then(currentThesauri => updateTranslation(currentThesauri, thesauri)
  .then(() => model.save(thesauri)));
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
    });
  },

  templateToThesauri(template, language, user) {
    const onlyPublished = !user;
    return entities.getByTemplate(template._id, language, onlyPublished)
    .then((response) => {
      template.values = response.map(entity => ({ id: entity.sharedId, label: entity.title, icon: entity.icon }));
      template.type = 'template';
      return template;
    });
  },

  getById(id) {
    return model.getById(id);
  },

  get(thesauriId, language, user) {
    let query;
    if (thesauriId) {
      query = { _id: thesauriId };
    }
    return Promise.all([
      model.get(query),
      templates.get(query)
    ])
    .then(([dictionaries, allTemplates]) => {
      const processTemplates = Promise.all(allTemplates.map(result => this.templateToThesauri(result, language, user)
      .then(templateTransformedInThesauri => templateTransformedInThesauri)));

      return processTemplates.then(processedTemplates => dictionaries.concat(processedTemplates));
    });
  },

  dictionaries(query) {
    return model.get(query);
  },

  entities(language) {
    return templates.get({ isEntity: true })
    .then(_templates => _templates.map(template => this.templateToThesauri(template, language)));
  },

  delete(id) {
    return templates.countByThesauri(id)
    .then((count) => {
      if (count) {
        return Promise.reject({ key: 'templates_using_dictionary', value: count });
      }
      return translations.deleteContext(id);
    })
    .then(() => model.delete(id))
    .then(() => ({ ok: true }));
  }
};
