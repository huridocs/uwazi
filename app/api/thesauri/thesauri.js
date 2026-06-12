/* eslint-disable max-lines */
import cloneDeep from 'lodash/cloneDeep.js';
import partition from 'lodash/partition.js';
import flatMapDeep from 'lodash/flatMapDeep.js';
import entities from '#api/entities/entities.js';
import { preloadOptionsLimit } from '#shared/config.js';
import templates from '#api/core/v1_layer/templates/templates.js';
import { denormalizeThesauriLabelInMetadata } from '#api/entities/denormalize.js';
import { search } from '#api/search/index.js';
import { objectIndex } from '#shared/data_utils/objectIndex.js';
import { sanitizeThesaurusLabel } from '#shared/sanitizationUtils.js';
import { ThesauriDAOFactory } from '#api/core/infrastructure/factories/ThesauriDAOFactory.js';
import { ThesauriServiceFactory } from '#api/core/infrastructure/factories/ThesauriServiceFactory.js';
import { ThesauriDataSourceFactory } from '#api/core/infrastructure/factories/ThesauriDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { Thesaurus } from '#api/core/domain/thesaurus/Thesaurus.js';

function normalizeThesaurusLabel(label) {
  const trimmed = label.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function calcNewLabels(originals, news) {
  const originalLabels = originals.map(v => v.label);
  const normalizedOriginals = originalLabels.map(normalizeThesaurusLabel);
  const normalizedSet = new Set(normalizedOriginals);
  const actualNewLabels = [];
  news.forEach(({ label }) => {
    const sanitizedLabel = sanitizeThesaurusLabel(label);
    const normalized = normalizeThesaurusLabel(sanitizedLabel);
    if (!normalizedSet.has(normalized)) {
      actualNewLabels.push(sanitizedLabel);
      normalizedSet.add(normalized);
    }
  });
  return actualNewLabels.map(label => ({ label }));
}

function calcNewValues(originalValues, newValues) {
  const values = cloneDeep(originalValues);
  const roots = values.filter(v => !v.values);
  const groups = values.filter(v => v.values);
  const [newRoots, newGroups] = partition(newValues, v => !v.values);

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
    const { _id: rawId, name, values = [] } = t;
    const _id = rawId ? rawId.toString() : undefined;

    const dataSource = ThesauriDataSourceFactory.default();
    const service = ThesauriServiceFactory.default();

    if (!_id) {
      const created = Thesaurus.create({ name, values });
      await service.insert(created);
      return { _id: created.id, name: created.name, values: created.values };
    }

    const existing = (await dataSource.getById(_id)).getDataOrThrow();
    const updated = existing.update({ name, values });
    await service.update(updated, {
      tenantName: ExecutionContext.tenant.name,
      actorId: ExecutionContext.actor?._id,
    });

    return { _id: updated.id, name: updated.name, values: updated.values };
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
  async getById(id) {
    const [dictionary] = await ThesauriDAOFactory.default().get([id]);
    return dictionary;
  },

  async get(thesauriId, language, user) {
    let ids;
    if (Array.isArray(thesauriId)) {
      ids = thesauriId.length ? thesauriId : undefined;
    } else if (thesauriId) {
      ids = [thesauriId];
    }

    const dictionaries = await ThesauriDAOFactory.default().get(ids);
    const allTemplates = ids ? await templates.get(ids) : await templates.getByMongoQuery({});

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

  dictionaries() {
    return ThesauriDAOFactory.default().get();
  },

  async renameThesaurusInMetadata(valueId, newLabel, thesaurusId, language) {
    return denormalizeThesauriLabelInMetadata(valueId, newLabel, thesaurusId, language);
  },
};

const flatThesaurusValues = (thesaurus, includeRoots = false) =>
  includeRoots
    ? flatMapDeep(thesaurus?.values, tv => {
        const { values = [], ...root } = tv;
        const valuesCopy = Array.from(values);
        valuesCopy.push(root);
        return valuesCopy;
      })
    : flatMapDeep(thesaurus?.values, tv => tv.values || tv);

export default thesauri;
export { thesauri, flatThesaurusValues, normalizeThesaurusLabel };
