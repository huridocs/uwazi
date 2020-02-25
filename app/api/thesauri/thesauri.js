/** @format */

import { generateIds, getUpdatedNames, getDeletedProperties } from 'api/templates/utils';
import entities from 'api/entities/entities';
import templates from 'api/templates/templates';
import settings from 'api/settings/settings';
import translations from 'api/i18n/translations';
import model from './dictionariesModel';
import { validateThesauri } from './validateThesauri';

const autoincrementValuesId = thesauri => {
  thesauri.values = generateIds(thesauri.values);

  thesauri.values = thesauri.values.map(value => {
    if (value.values) {
      value.values = generateIds(value.values);
    }

    return value;
  });
  return thesauri;
};

function thesauriToTranslatioNContext(thesauri) {
  return thesauri.values.reduce((ctx, prop) => {
    ctx[prop.label] = prop.label;
    if (prop.values) {
      const propctx = prop.values.reduce((_ctx, val) => {
        _ctx[val.label] = val.label;
        return _ctx;
      }, {});
      ctx = Object.assign(ctx, propctx);
    }
    return ctx;
  }, {});
}

const create = async thesauri => {
  const context = thesauriToTranslatioNContext(thesauri);
  context[thesauri.name] = thesauri.name;

  const created = await model.save(thesauri);
  await translations.addContext(created._id, thesauri.name, context, 'Dictionary');
  return created;
};

const updateTranslation = (current, thesauri) => {
  const currentProperties = current.values;
  const newProperties = thesauri.values;

  const updatedLabels = getUpdatedNames(currentProperties, newProperties, 'label');
  if (current.name !== thesauri.name) {
    updatedLabels[current.name] = thesauri.name;
  }
  const deletedPropertiesByLabel = getDeletedProperties(currentProperties, newProperties, 'label');
  const context = thesauriToTranslatioNContext(thesauri);

  context[thesauri.name] = thesauri.name;
  return translations.updateContext(
    current._id,
    thesauri.name,
    updatedLabels,
    deletedPropertiesByLabel,
    context,
    'Dictionary'
  );
};

async function updateOptionsInEntities(current, thesauri) {
  const currentProperties = current.values;
  const newProperties = thesauri.values;
  const deletedPropertiesById = getDeletedProperties(currentProperties, newProperties, 'id');
  await Promise.all(
    deletedPropertiesById.map(deletedId =>
      entities.deleteThesaurusFromMetadata(deletedId, thesauri._id)
    )
  );

  const updatedIds = getUpdatedNames(currentProperties, newProperties, 'label', 'id');
  const defaultLanguage = (await settings.get()).languages.find(lang => lang.default).key;
  await Promise.all(
    Object.entries(updatedIds).map(([updatedId, newLabel]) =>
      entities.renameThesaurusInMetadata(updatedId, newLabel, thesauri._id, defaultLanguage)
    )
  );
}

const update = async thesauri => {
  const currentThesauri = await model.getById(thesauri._id);
  await updateTranslation(currentThesauri, thesauri);
  await updateOptionsInEntities(currentThesauri, thesauri);
  return model.save(thesauri);
};

export default {
  async save(t) {
    const thesauri = { values: [], type: 'thesauri', ...t };

    autoincrementValuesId(thesauri);

    await validateThesauri(thesauri);

    if (thesauri._id) {
      return update(thesauri);
    }
    return create(thesauri);
  },

  templateToThesauri(template, language, user) {
    const onlyPublished = !user;
    return entities.getByTemplate(template._id, language, onlyPublished).then(response => {
      template.values = response.map(entity => ({
        id: entity.sharedId,
        label: entity.title,
        icon: entity.icon,
        type: entity.file ? 'document' : 'entity',
      }));
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
    return Promise.all([model.get(query), templates.get(query)]).then(
      ([dictionaries, allTemplates]) => {
        const processTemplates = Promise.all(
          allTemplates.map(result =>
            this.templateToThesauri(result, language, user).then(
              templateTransformedInThesauri => templateTransformedInThesauri
            )
          )
        );

        return processTemplates.then(processedTemplates => dictionaries.concat(processedTemplates));
      }
    );
  },

  dictionaries(query) {
    return model.get(query);
  },

  delete(id) {
    return templates
      .countByThesauri(id)
      .then(count => {
        if (count) {
          return Promise.reject({ key: 'templates_using_dictionary', value: count });
        }
        return translations.deleteContext(id);
      })
      .then(() => model.delete(id))
      .then(() => ({ ok: true }));
  },
};
