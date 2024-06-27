import _ from 'lodash';
import {
  generateIds,
  getUpdatedIds,
  getUpdatedNames,
  getDeletedProperties,
} from 'api/templates/utils';
import entities from 'api/entities/entities';
import { preloadOptionsLimit } from 'shared/config';
import templates from 'api/templates/templates';
import settings from 'api/settings/settings';
import translations from 'api/i18n/translations';
import { denormalizeThesauriLabelInMetadata } from 'api/entities/denormalize';
import { search } from 'api/search';
import model from './dictionariesModel';
import { validateThesauri } from './validateThesauri';
import { objectIndex } from 'shared/data_utils/objectIndex';

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

function normalizeThesaurusLabel(label) {
  const trimmed = label.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function thesauriToTranslationContext(thesauri) {
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
  const context = thesauriToTranslationContext(thesauri);
  context[thesauri.name] = thesauri.name;

  const created = await model.save(thesauri);
  await translations.addContext(created._id, thesauri.name, context, 'Thesaurus');
  return created;
};

const updateTranslation = (current, thesauri) => {
  const currentProperties = current.values;
  const newProperties = thesauri.values;

  const { update: updatedLabels, delete: removedThroughUpdate } = getUpdatedNames(
    {
      prop: 'label',
      outKey: 'label',
      filterBy: 'id',
    },
    currentProperties,
    newProperties
  );
  if (current.name !== thesauri.name) {
    updatedLabels[current.name] = thesauri.name;
  }
  const deletedPropertiesByLabel = getDeletedProperties(
    currentProperties,
    newProperties,
    'id',
    'label'
  );
  const allRemoved = Array.from(new Set(deletedPropertiesByLabel.concat(removedThroughUpdate)));

  const context = thesauriToTranslationContext(thesauri);

  context[thesauri.name] = thesauri.name;
  return translations.updateContext(
    { id: current._id.toString(), label: thesauri.name, type: 'Thesaurus' },
    updatedLabels,
    allRemoved,
    context
  );
};

async function updateOptionsInEntities(current, thesauri) {
  const currentProperties = current.values;
  const newProperties = thesauri.values;
  const deletedPropertiesById = getDeletedProperties(currentProperties, newProperties, 'id', 'id');
  await Promise.all(
    deletedPropertiesById.map(deletedId =>
      entities.deleteThesaurusFromMetadata(deletedId, thesauri._id)
    )
  );

  const updatedIds = getUpdatedIds(
    {
      prop: 'label',
      filterBy: 'id',
    },
    currentProperties,
    newProperties
  );
  const toUpdate = [];

  Object.keys(updatedIds).forEach(id => {
    const option = newProperties
      .reduce((flattendedOptions, o) => flattendedOptions.concat([o, ...(o.values || [])]), [])
      .find(o => o.id === id);

    if (option.values?.length) {
      option.values.forEach(o => {
        toUpdate.push({ id: o.id, label: o.label, parent: { id, label: updatedIds[id] } });
      });
      return;
    }

    toUpdate.push({ id, label: updatedIds[id] });
  });

  const defaultLanguage = (await settings.get()).languages.find(lang => lang.default).key;
  await Promise.all(
    toUpdate.map(option =>
      denormalizeThesauriLabelInMetadata(
        option.id,
        option.label,
        thesauri._id,
        defaultLanguage,
        option.parent
      )
    )
  );
}

const update = async thesauri => {
  const currentThesauri = await model.getById(thesauri._id);
  const valuesHaveChanged =
    JSON.stringify(thesauri.values) !== JSON.stringify(currentThesauri.values);
  const nameHasChanged = thesauri.name !== currentThesauri.name;
  if (valuesHaveChanged || nameHasChanged) {
    await updateTranslation(currentThesauri, thesauri);
    await updateOptionsInEntities(currentThesauri, thesauri);
  }
  return model.save(thesauri);
};

function calcNewLabels(originals, news) {
  const originalLabels = originals.map(v => v.label);
  const normalizedOriginals = originalLabels.map(normalizeThesaurusLabel);
  const normalizedSet = new Set(normalizedOriginals);
  const actualNewLabels = [];
  news.forEach(({ label }) => {
    const normalized = normalizeThesaurusLabel(label);
    if (!normalizedSet.has(normalized)) {
      actualNewLabels.push(label);
      normalizedSet.add(normalized);
    }
  });
  return actualNewLabels.map(label => ({ label }));
}

function calcNewValues(originalValues, newValues) {
  const values = _.cloneDeep(originalValues);
  const roots = values.filter(v => !v.values);
  const groups = values.filter(v => v.values);
  const [newRoots, newGroups] = _.partition(newValues, v => !v.values);

  const finalNewRoots = calcNewLabels(roots, newRoots);
  values.push(...finalNewRoots);

  const groupsByNormalizedLabel = objectIndex(
    groups,
    v => normalizeThesaurusLabel(v.label),
    v => v
  );
  const finalNewGroups = [];
  newGroups.forEach(newGroup => {
    const normalizedLabel = normalizeThesaurusLabel(newGroup.label);
    if (!(normalizedLabel in groupsByNormalizedLabel)) {
      const emptyNewGroup = { label: newGroup.label, values: [] };
      finalNewGroups.push(emptyNewGroup);
      groupsByNormalizedLabel[normalizedLabel] = emptyNewGroup;
    }
    const group = groupsByNormalizedLabel[normalizedLabel];
    const newLocalValues = calcNewLabels(group.values, newGroup.values);
    group.values.push(...newLocalValues);
  });
  values.push(...finalNewGroups);

  return values;
}

const thesauri = {
  async save(t) {
    const toSave = { values: [], type: 'thesauri', ...t };

    autoincrementValuesId(toSave);

    await validateThesauri(toSave);

    if (toSave._id) {
      return update(toSave);
    }
    return create(toSave);
  },

  appendValues(thesaurus, newValues) {
    return {
      ...thesaurus,
      values: calcNewValues(thesaurus.values || [], newValues),
    };
  },

  entitiesToThesauri(_entities) {
    const values = _entities.map(entity => ({
      id: entity.sharedId,
      label: entity.title,
      icon: entity.icon,
    }));
    return { values };
  },

  async templateToThesauri(template, language, user, countPerTemplate) {
    const onlyPublished = !user;
    const _entities = await entities.getByTemplate(
      template._id,
      language,
      preloadOptionsLimit(),
      onlyPublished
    );
    const values = this.entitiesToThesauri(_entities);
    return Object.assign(template, values, {
      type: 'template',
      optionsCount: countPerTemplate[template._id.toString()],
    });
  },

  getById(id) {
    return model.getById(id);
  },

  async get(thesauriId, language, user) {
    let query;
    if (thesauriId) {
      query = { _id: thesauriId };
    }

    const dictionaries = await model.get(query);
    const allTemplates = await templates.get(query);

    if (allTemplates.length && language) {
      const templateCount = await search.countPerTemplate(language);

      const processedTemplates = await Promise.all(
        allTemplates.map(result =>
          this.templateToThesauri(result, language, user, templateCount).then(
            templateTransformedInThesauri => templateTransformedInThesauri
          )
        )
      );
      return dictionaries.concat(processedTemplates);
    }

    return dictionaries;
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

  async renameThesaurusInMetadata(valueId, newLabel, thesaurusId, language) {
    return denormalizeThesauriLabelInMetadata(valueId, newLabel, thesaurusId, language);
  },
};

const flatThesaurusValues = (thesaurus, includeRoots = false) =>
  includeRoots
    ? _.flatMapDeep(thesaurus?.values, tv => {
        const { values = [], ...root } = tv;
        const valuesCopy = Array.from(values);
        valuesCopy.push(root);
        return valuesCopy;
      })
    : _.flatMapDeep(thesaurus?.values, tv => tv.values || tv);

export default thesauri;
export { thesauri, flatThesaurusValues, normalizeThesaurusLabel };
