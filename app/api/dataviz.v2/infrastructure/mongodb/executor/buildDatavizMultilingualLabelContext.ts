import type { Db } from 'mongodb';
import { ObjectId } from 'mongodb';
import type { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import type { TranslationsDataSource } from '#api/i18n.v2/contracts/TranslationsDataSource.js';
import { TranslationCollection } from '#api/i18n.v2/model/TranslationCollection.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import type { DatavizQuery, DimensionSpec } from '#shared/types/datavizSchema.js';
import { TEMPLATE_DIMENSION_PROPERTY } from '#shared/types/datavizSchema.js';
import { TemplateDBO } from '#api/core/infrastructure/mongodb/template/DBOs/TemplateDBO.js';
import {
  buildMissingBucketLabels,
  type DatavizMultilingualLabelContext,
} from './DatavizMultilingualLabelResolver.js';
import { loadEntityTitleLabels } from './loadEntityTitleLabels.js';

type ThesaurusValue = { id: string; label: string; values?: ThesaurusValue[] };

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

const loadTemplateNames = async (db: Db, query: DatavizQuery): Promise<Map<string, string>> => {
  const ids = [
    ...query.sources.map(source => source.templateId),
    ...(query.dimensions.some(dimension => dimension.property === TEMPLATE_DIMENSION_PROPERTY)
      ? query.sources.map(source => source.templateId)
      : []),
  ];
  const uniqueIds = [...new Set(ids)].map(id => ObjectId.createFromHexString(id));
  const templates = await db
    .collection<TemplateDBO>('templates')
    .find({ _id: { $in: uniqueIds } })
    .toArray();

  return new Map(templates.map(template => [template._id.toHexString(), template.name]));
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
  db: Db,
  translationsDS: TranslationsDataSource,
  query: DatavizQuery
): Promise<Map<string, { valueLabels: Map<string, string>; translations: TranslationCollection }>> => {
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

  const sourceTemplateIds = query.sources.map(source => ObjectId.createFromHexString(source.templateId));
  const sourceTemplates = await db
    .collection<TemplateDBO>('templates')
    .find({ _id: { $in: sourceTemplateIds } })
    .toArray();

  const relatedTemplateIds = new Set<ObjectId>();
  sourceTemplates.forEach(template => {
    template.properties?.forEach(prop => {
      if (prop.content && (prop.type === 'relationship' || prop.type === 'newRelationship')) {
        relatedTemplateIds.add(ObjectId.createFromHexString(prop.content));
      }
    });
  });

  const allTemplateIds = [...sourceTemplateIds, ...relatedTemplateIds];
  const templates = await db
    .collection<TemplateDBO>('templates')
    .find({ _id: { $in: allTemplateIds } })
    .toArray();
  const templatesById = new Map(templates.map(template => [template._id.toHexString(), template]));

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

  const dictionaries = await db
    .collection<{ _id: ObjectId; values: ThesaurusValue[] }>('dictionaries')
    .find({ _id: { $in: [...thesaurusIds].map(id => ObjectId.createFromHexString(id)) } })
    .toArray();

  const thesaurusValueLabels = new Map<string, Map<string, string>>();
  dictionaries.forEach(dict => {
    thesaurusValueLabels.set(dict._id.toHexString(), flattenThesaurusValues(dict.values ?? []));
  });

  const thesaurusTranslations = new Map<string, TranslationCollection>();
  await Promise.all(
    [...thesaurusIds].map(async thesaurusId => {
      const translations = await translationsDS.getByContext(thesaurusId).all();
      thesaurusTranslations.set(thesaurusId, new TranslationCollection(translations));
    })
  );

  const result = new Map<string, { valueLabels: Map<string, string>; translations: TranslationCollection }>();
  propertyToThesaurus.forEach((thesaurusId, propertyName) => {
    const valueLabels = thesaurusValueLabels.get(thesaurusId);
    const translations = thesaurusTranslations.get(thesaurusId);
    if (valueLabels && translations) {
      result.set(propertyName, { valueLabels, translations });
    }
  });

  return result;
};

const relatedEntityProperties = (dimensions: DimensionSpec[]): Set<string> =>
  new Set(
    dimensions
      .filter(dimension => dimension.relationshipMode === 'related_entity')
      .map(dimension => dimension.property)
  );

export const buildDatavizMultilingualLabelContext = async (params: {
  db: Db;
  query: DatavizQuery;
  settingsDS: SettingsDataSource;
  translationsDS: TranslationsDataSource;
  bucketKeys: string[];
}): Promise<DatavizMultilingualLabelContext> => {
  const { db, query, settingsDS, translationsDS, bucketKeys } = params;

  const languages = await settingsDS.getLanguageKeys();
  const defaultLanguage = await settingsDS.getDefaultLanguageKey();
  const templateNames = await loadTemplateNames(db, query);
  const templateIds = [...new Set(query.sources.map(source => source.templateId))];
  const templateTranslations = await loadTemplateTranslations(translationsDS, templateIds);
  const propertyThesaurus = await loadPropertyThesaurus(db, translationsDS, query);
  const relatedEntityDims = relatedEntityProperties(query.dimensions);

  const entityTitles =
    relatedEntityDims.size > 0
      ? await loadEntityTitleLabels(db, bucketKeys, languages as LanguageISO6391[])
      : new Map();

  return {
    languages: languages as LanguageISO6391[],
    defaultLanguage,
    templateNames,
    templateTranslations,
    propertyThesaurus,
    relatedEntityProperties: relatedEntityDims,
    entityTitles,
    missingBucketLabels: buildMissingBucketLabels(languages as LanguageISO6391[]),
  };
};
