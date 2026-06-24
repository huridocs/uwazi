import type { ObjectId } from 'mongodb';
import type { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import type { TranslationsDataSource } from '#api/i18n.v2/contracts/TranslationsDataSource.js';
import { TranslationCollection } from '#api/i18n.v2/model/TranslationCollection.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import type { LocalizedLabels } from '#shared/types/datavizSchema.js';
import type { DatavizQuery, DimensionSpec } from '#shared/types/datavizSchema.js';
import { TEMPLATE_DIMENSION_PROPERTY } from '#shared/types/datavizSchema.js';
import type { TemplateDBO } from '#api/core/infrastructure/mongodb/template/DBOs/TemplateDBO.js';
import {
  buildMissingBucketLabels,
  type DatavizMultilingualLabelContext,
} from './DatavizMultilingualLabelResolver.js';

type ThesaurusValue = { id: string; label: string; values?: ThesaurusValue[] };

type ThesaurusReadRow = {
  _id: ObjectId | string;
  name: string;
  values: ThesaurusValue[];
};

export type TemplatesReadDAO = {
  get(ids?: string[]): Promise<TemplateDBO[]>;
};

export type ThesauriReadDAO = {
  get(ids?: string[]): Promise<ThesaurusReadRow[]>;
};

export type DatavizLabelContextDeps = {
  settingsDS: SettingsDataSource;
  templatesDAO: TemplatesReadDAO;
  thesauriDAO: ThesauriReadDAO;
  translationsDS: TranslationsDataSource;
};

const templateIdFromDBO = (template: TemplateDBO): string => template._id.toHexString();

const thesaurusIdFromRow = (row: ThesaurusReadRow): string =>
  typeof row._id === 'string' ? row._id : row._id.toHexString();

const flattenThesaurusValues = (values: ThesaurusValue[]): Map<string, string> => {
  const map = new Map<string, string>();

  const flatten = (items: ThesaurusValue[]) => {
    items.forEach(item => {
      map.set(item.id, item.label);
      if (item.values) {
        flatten(item.values);
      }
    });
  };

  flatten(values);
  return map;
};

const loadTemplateNames = async (
  templatesDAO: TemplatesReadDAO,
  query: DatavizQuery
): Promise<Map<string, string>> => {
  const ids = [
    ...query.sources.map(source => source.templateId),
    ...(query.dimensions.some(dimension => dimension.property === TEMPLATE_DIMENSION_PROPERTY)
      ? query.sources.map(source => source.templateId)
      : []),
  ];
  const uniqueIds = [...new Set(ids)];
  const templates = await templatesDAO.get(uniqueIds);

  return new Map(templates.map(template => [templateIdFromDBO(template), template.name]));
};

const loadTemplateTranslations = async (
  translationsDS: TranslationsDataSource,
  templateIds: string[]
): Promise<Map<string, TranslationCollection>> => {
  const result = new Map<string, TranslationCollection>();

  await Promise.all(
    templateIds.map(async templateId => {
      const translations = await translationsDS.getByContext(templateId).all();
      result.set(templateId, new TranslationCollection(translations));
    })
  );

  return result;
};

const loadPropertyThesaurus = async (
  templatesDAO: TemplatesReadDAO,
  thesauriDAO: ThesauriReadDAO,
  translationsDS: TranslationsDataSource,
  query: DatavizQuery
): Promise<
  Map<string, { valueLabels: Map<string, string>; translations: TranslationCollection }>
> => {
  const propertyNames = query.dimensions
    .filter(dimension => dimension.property !== TEMPLATE_DIMENSION_PROPERTY)
    .filter(
      dimension =>
        dimension.relationshipMode !== 'related_entity' &&
        dimension.propertyType !== 'date' &&
        dimension.propertyType !== 'multidate' &&
        dimension.propertyType !== 'daterange' &&
        dimension.propertyType !== 'multidaterange'
    )
    .map(dimension => dimension.property);

  if (propertyNames.length === 0) {
    return new Map();
  }

  const sourceTemplateIds = query.sources.map(source => source.templateId);
  const sourceTemplates = await templatesDAO.get(sourceTemplateIds);

  const relatedTemplateIds = new Set<string>();
  sourceTemplates.forEach(template => {
    template.properties?.forEach(prop => {
      if (prop.content && (prop.type === 'relationship' || prop.type === 'newRelationship')) {
        relatedTemplateIds.add(prop.content);
      }
    });
  });

  const allTemplateIds = [...new Set([...sourceTemplateIds, ...relatedTemplateIds])];
  const templates = await templatesDAO.get(allTemplateIds);
  const templatesById = new Map(templates.map(template => [templateIdFromDBO(template), template]));

  const thesaurusIds = new Set<string>();
  const propertyToThesaurus = new Map<string, string>();
  const dimensionByProperty = new Map(
    query.dimensions
      .filter(dimension => dimension.property !== TEMPLATE_DIMENSION_PROPERTY)
      .map(dimension => [dimension.property, dimension])
  );

  sourceTemplates.forEach(template => {
    template.properties?.forEach(prop => {
      if (!propertyNames.includes(prop.name)) {
        return;
      }

      const dimension = dimensionByProperty.get(prop.name);

      if (
        dimension?.relationshipMode === 'inherited' &&
        (dimension.propertyType === 'select' || dimension.propertyType === 'multiselect') &&
        prop.content &&
        prop.inherit?.property
      ) {
        const relatedTemplate = templatesById.get(prop.content);
        const inheritedProp = relatedTemplate?.properties?.find(
          item => item._id?.toString() === prop.inherit?.property?.toString()
        );
        if (inheritedProp?.content) {
          thesaurusIds.add(inheritedProp.content);
          propertyToThesaurus.set(prop.name, inheritedProp.content);
        }
        return;
      }

      if (prop.content && (prop.type === 'select' || prop.type === 'multiselect')) {
        thesaurusIds.add(prop.content);
        propertyToThesaurus.set(prop.name, prop.content);
      }
    });
  });

  if (thesaurusIds.size === 0) {
    return new Map();
  }

  const thesauri = await thesauriDAO.get([...thesaurusIds]);

  const thesaurusValueLabels = new Map<string, Map<string, string>>();
  thesauri.forEach(row => {
    thesaurusValueLabels.set(thesaurusIdFromRow(row), flattenThesaurusValues(row.values ?? []));
  });

  const thesaurusTranslations = new Map<string, TranslationCollection>();
  await Promise.all(
    [...thesaurusIds].map(async thesaurusId => {
      const translations = await translationsDS.getByContext(thesaurusId).all();
      thesaurusTranslations.set(thesaurusId, new TranslationCollection(translations));
    })
  );

  const result = new Map<
    string,
    { valueLabels: Map<string, string>; translations: TranslationCollection }
  >();
  propertyToThesaurus.forEach((thesaurusId, propertyName) => {
    const valueLabels = thesaurusValueLabels.get(thesaurusId);
    const translations = thesaurusTranslations.get(thesaurusId);
    if (valueLabels && translations) {
      result.set(propertyName, { valueLabels, translations });
    }
  });

  return result;
};

export const relatedEntityProperties = (dimensions: DimensionSpec[]): Set<string> =>
  new Set(
    dimensions
      .filter(dimension => dimension.relationshipMode === 'related_entity')
      .map(dimension => dimension.property)
  );

export const buildDatavizMultilingualLabelContext = async (params: {
  query: DatavizQuery;
  entityTitles: Map<string, LocalizedLabels>;
  deps: DatavizLabelContextDeps;
}): Promise<DatavizMultilingualLabelContext> => {
  const { query, entityTitles, deps } = params;
  const { settingsDS, templatesDAO, thesauriDAO, translationsDS } = deps;

  const languages = await settingsDS.getLanguageKeys();
  const defaultLanguage = await settingsDS.getDefaultLanguageKey();
  const templateNames = await loadTemplateNames(templatesDAO, query);
  const templateIds = [...new Set(query.sources.map(source => source.templateId))];
  const templateTranslations = await loadTemplateTranslations(translationsDS, templateIds);
  const propertyThesaurus = await loadPropertyThesaurus(
    templatesDAO,
    thesauriDAO,
    translationsDS,
    query
  );

  return {
    languages: languages as LanguageISO6391[],
    defaultLanguage,
    templateNames,
    templateTranslations,
    propertyThesaurus,
    relatedEntityProperties: relatedEntityProperties(query.dimensions),
    entityTitles,
    missingBucketLabels: buildMissingBucketLabels(languages as LanguageISO6391[]),
  };
};
