import {
  EntityFilters,
  FindByMetadataCriteriaQuery,
  FindByTemplateIdRangeQuery,
  FindOptions,
  MetadataCriteria,
} from '#api/core/application/contracts/EntitiesDAO.js';
import { PostgresTable } from '../common/PostgresTable.js';
import { EntityRow } from './PostgresEntityRow.js';

type EntityQuery = PostgresTable<EntityRow>;

const applyMetadataValueIn = (
  query: EntityQuery,
  metadataValueIn: EntityFilters['metadataValueIn']
): EntityQuery => {
  if (metadataValueIn === undefined) {
    return query;
  }
  if (metadataValueIn.length === 0) {
    // An empty OR list must match nothing, not everything.
    return query.whereIn('_id', []);
  }
  return query.whereJsonSupersetOfAny(
    'metadata',
    metadataValueIn.map(({ property, value }) => ({ [property]: [{ value }] }))
  );
};

const applyEntityFilters = (query: EntityQuery, filters: EntityFilters): EntityQuery => {
  const branches: Array<(current: EntityQuery) => EntityQuery> = [
    current => (filters._id !== undefined ? current.where({ _id: filters._id }) : current),
    current => (filters.ids !== undefined ? current.whereIn('_id', filters.ids) : current),
    current =>
      filters.sharedId !== undefined ? current.where({ sharedId: filters.sharedId }) : current,
    current =>
      filters.sharedIds !== undefined ? current.whereIn('sharedId', filters.sharedIds) : current,
    current =>
      filters.language !== undefined ? current.where({ language: filters.language }) : current,
    current =>
      filters.languages !== undefined ? current.whereIn('language', filters.languages) : current,
    current =>
      filters.template !== undefined ? current.where({ template: filters.template }) : current,
    current =>
      filters.templateIds !== undefined
        ? current.whereIn('template', filters.templateIds)
        : current,
    current => (filters.title !== undefined ? current.where({ title: filters.title }) : current),
    current => (filters.titleNotEmpty ? current.whereNot('title', '') : current),
    current =>
      filters.published !== undefined ? current.where({ published: filters.published }) : current,
    current => applyMetadataValueIn(current, filters.metadataValueIn),
  ];

  return branches.reduce((current, apply) => apply(current), query);
};

const applyFindOptions = (query: EntityQuery, options: FindOptions): EntityQuery => {
  const selected =
    options.select && options.select.length > 0 ? query.select(options.select) : query;
  const sorted = (options.sort ?? []).reduce(
    (current, { field, direction }) => current.orderBy(field, direction),
    selected
  );
  return options.limit ? sorted.limit(options.limit) : sorted;
};

const applyTemplateIdBounds = (
  table: EntityQuery,
  query: FindByTemplateIdRangeQuery
): EntityQuery => {
  let bounded = table.where({ template: query.templateId });

  if (query.from && query.to) {
    bounded = bounded.whereBetween('_id', [query.from, query.to]);
  } else if (query.from) {
    bounded = bounded.whereRaw('?? >= ?', ['_id', query.from]);
  } else if (query.to) {
    bounded = bounded.whereRaw('?? <= ?', ['_id', query.to]);
  }

  if (query.language !== undefined) {
    bounded = bounded.where({ language: query.language });
  }

  return bounded;
};

const applyMetadataCriterion = (query: EntityQuery, criteria: MetadataCriteria): EntityQuery => {
  const withExists = criteria.exists
    ? query.whereRaw('?? @> ?', ['metadata', JSON.stringify({ [criteria.property]: [] })])
    : query;
  const withNonEmpty = criteria.nonEmpty
    ? withExists.whereRaw('jsonb_array_length(??->?) > 0', ['metadata', criteria.property])
    : withExists;
  return criteria.hasValues
    ? withNonEmpty.whereRaw(
        "EXISTS (SELECT 1 FROM jsonb_array_elements(??->?) AS elem WHERE elem->>'value' IS NOT NULL AND elem->>'value' <> '')",
        ['metadata', criteria.property]
      )
    : withNonEmpty;
};

const applyMetadataCriteria = (
  query: EntityQuery,
  criteria: FindByMetadataCriteriaQuery['criteria']
): EntityQuery => criteria.reduce((current, item) => applyMetadataCriterion(current, item), query);

export { applyEntityFilters, applyFindOptions, applyMetadataCriteria, applyTemplateIdBounds };
export type { EntityQuery };
