import type { ObjectId } from 'mongodb';
import { EntitiesDAOFactory } from '#api/core/infrastructure/factories/EntitiesDAOFactory.js';
import type { EntityDBO } from '#api/core/infrastructure/mongodb/entity/EntityDBO.js';
import type { EntityFilters, FindOptions } from '#api/core/application/contracts/EntitiesDAO.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';

/**
 * Query contract for the entities facade. Only these fields are supported;
 * anything else (mongo operators, metadata paths, ...) is a type error.
 */
export type EntitiesQuery = {
  _id?: string | ObjectId;
  sharedId?: string | { $in: string[] };
  language?: string;
  template?: string | ObjectId;
  title?: string;
};

export type EntitiesSelect = string | string[] | { [field: string]: 1 | true };

export type EntitiesGetOptions = {
  withoutDocuments?: boolean;
  limit?: number;
  sort?: { [field: string]: 'asc' | 'desc' };
};

const selectToArray = (select?: EntitiesSelect): string[] => {
  if (!select) {
    return [];
  }
  if (Array.isArray(select)) {
    return select;
  }
  if (typeof select === 'string') {
    // mongoose '+field' means "include in addition to the default fields"
    // (e.g. '+permissions') -> full document, no projection restriction.
    if (select.includes('+')) {
      return [];
    }
    return select
      .split(',')
      .map(s => s.trim().replace(/^\+/, ''))
      .filter(Boolean);
  }
  return Object.keys(select);
};

const translateQueryToFilters = (query: EntitiesQuery): EntityFilters => {
  const filters: EntityFilters = {};
  if (query._id) {
    filters._id = query._id.toString();
  }
  if (query.sharedId !== undefined) {
    if (typeof query.sharedId === 'object') {
      filters.sharedIds = query.sharedId.$in;
    } else {
      filters.sharedId = query.sharedId;
    }
  }
  if (query.language) {
    filters.language = query.language;
  }
  if (query.template) {
    filters.template = query.template.toString();
  }
  if (query.title) {
    filters.title = query.title;
  }
  return filters;
};

const buildFindOptions = (
  select?: EntitiesSelect,
  options: EntitiesGetOptions = {}
): FindOptions => {
  const fields = selectToArray(select);
  const findOptions: FindOptions = {};
  if (fields.length) {
    findOptions.select = [...new Set([...fields, 'sharedId', '_id'])];
  }
  if (options.limit) {
    findOptions.limit = options.limit;
  }
  if (options.sort) {
    findOptions.sort = Object.entries(options.sort).map(([field, direction]) => ({
      field,
      direction,
    }));
  }
  if (!options.withoutDocuments) {
    findOptions.withFiles = true;
  }
  return findOptions;
};

export default {
  async getUnrestricted(query: EntitiesQuery, select?: EntitiesSelect): Promise<EntityDBO[]> {
    const filters = translateQueryToFilters(query);
    if (filters.sharedIds && filters.sharedIds.length === 0) {
      return [];
    }
    return EntitiesDAOFactory.default()
      .unrestricted()
      .find(filters, buildFindOptions(select, { withoutDocuments: true }));
  },

  async getUnrestrictedWithDocuments(
    query: EntitiesQuery,
    select?: EntitiesSelect,
    options: EntitiesGetOptions = {}
  ): Promise<EntityDBO[]> {
    const filters = translateQueryToFilters(query);
    if (filters.sharedIds && filters.sharedIds.length === 0) {
      return [];
    }
    return EntitiesDAOFactory.default()
      .unrestricted()
      .find(filters, buildFindOptions(select, options));
  },

  async get(
    query: EntitiesQuery,
    select?: EntitiesSelect,
    options: EntitiesGetOptions = {}
  ): Promise<EntityDBO[]> {
    const filters = translateQueryToFilters(query);
    if (filters.sharedIds && filters.sharedIds.length === 0) {
      return [];
    }
    return EntitiesDAOFactory.default().find(filters, buildFindOptions(select, options));
  },

  async getById(id: string, language?: LanguageISO6391): Promise<EntityDBO | null> {
    const dao = EntitiesDAOFactory.default();
    return language ? dao.getBySharedId(id, language) : dao.getByInternalId(id);
  },
};
