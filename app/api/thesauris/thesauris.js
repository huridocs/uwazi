import entities from 'api/entities/entities';
import translations from 'api/i18n/translations';
import templates from 'api/templates/templates';
import {generateIds, getUpdatedNames, getDeletedProperties} from 'api/templates/utils';
import model from './dictionariesModel';

let autoincrementValuesId = (thesauri) => {
  thesauri.values = generateIds(thesauri.values);
  return thesauri;
};

let checkDuplicated = (thesauri) => {
  return model.get()
  .then((thesauris) => {
    let duplicated = thesauris.find((entry) => {
      let sameEntity = entry._id.equals(thesauri._id);
      let sameName = entry.name.trim().toLowerCase() === thesauri.name.trim().toLowerCase();
      return sameName && !sameEntity;
    });

    if (duplicated) {
      return Promise.reject('duplicated_entry');
    }
  });
};

function _save(thesauri) {
  let context = thesauri.values.reduce((ctx, value) => {
    ctx[value.label] = value.label;
    return ctx;
  }, {});
  context[thesauri.name] = thesauri.name;

  return model.save(thesauri)
  .then((response) => {
    return translations.addContext(response._id, thesauri.name, context, 'Dictionary')
    .then(() => response);
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

  return translations.updateContext(current._id, thesauri.name, updatedLabels, deletedPropertiesByLabel, context);
};

function _update(thesauri) {
  return model.getById(thesauri._id)
  .then((currentThesauri) => {
    return updateTranslation(currentThesauri, thesauri)
    .then(() => model.save(thesauri));
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
    });
  },

  templateToThesauri(template, language, user) {
    const onlyPublished = !user;
    return entities.getByTemplate(template._id, language, onlyPublished)
    .then((response) => {
      template.values = response.map((entity) => {
        return {id: entity.sharedId, label: entity.title, icon: entity.icon};
      });
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
      query = {_id: thesauriId};
    }
    return Promise.all([
      model.get(query),
      templates.get(query)
    ])
    .then(([dictionaries, allTemplates]) => {
      let processTemplates = Promise.all(allTemplates.map((result) => {
        return this.templateToThesauri(result, language, user)
        .then((templateTransformedInThesauri) => {
          return templateTransformedInThesauri;
        });
      }));

      return processTemplates.then((processedTemplates) => {
        return dictionaries.concat(processedTemplates);
      });
    });
  },

  dictionaries(query) {
    return model.get(query);
  },

  entities(language) {
    return templates.get({isEntity: true})
    .then((_templates) => {
      return _templates.map((template) => {
        return this.templateToThesauri(template, language);
      });
    });
  },

  delete(id) {
    return templates.countByThesauri(id)
    .then((count) => {
      if (count) {
        return Promise.reject({key: 'templates_using_dictionary', value: count});
      }
      return translations.deleteContext(id);
    })
    .then(() => model.delete(id))
    .then(() => {
      return {ok: true};
    });
  }
};
