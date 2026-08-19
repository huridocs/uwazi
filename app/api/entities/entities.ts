import type { ObjectId } from 'mongodb';
import { EntitiesDAOFactory } from '#api/core/infrastructure/factories/EntitiesDAOFactory.js';
import type { EntityDBO } from '#api/core/infrastructure/mongodb/entity/EntityDBO.js';
import type {
  EntityFilters,
  FindOptions,
  FindWithFilesOptions,
} from '#api/core/application/contracts/EntitiesDAO.js';
import type { EntityWithFilesSchema } from '#shared/types/entityType.js';
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

/**
 * Shared read path for the facade. `enforce` selects the enforced vs
 * unrestricted DAO view; `forceWithoutDocuments` forces the no-files branch
 * (for `getUnrestricted`). Otherwise the caller's `withoutDocuments` option
 * decides, defaulting to loading documents/attachments.
 *
 * The with-files branch is the core→shared boundary: the DAO returns the core
 * `EntityWithFiles` shape, surfaced to V1 callers as the shared
 * `EntityWithFilesSchema`. Centralizing the cast here lets call sites drop
 * their `as unknown as EntityWithFilesSchema[]` casts.
 */
const findEntities = async (
  query: EntitiesQuery,
  select: EntitiesSelect | undefined,
  options: EntitiesGetOptions | undefined,
  { enforce, forceWithoutDocuments }: { enforce: boolean; forceWithoutDocuments: boolean }
): Promise<EntityDBO[] | EntityWithFilesSchema[]> => {
  const filters = translateQueryToFilters(query);
  if (filters.sharedIds && filters.sharedIds.length === 0) {
    return [];
  }
  const mergedOptions: EntitiesGetOptions = forceWithoutDocuments
    ? { ...(options ?? {}), withoutDocuments: true }
    : (options ?? {});
  const findOptions = buildFindOptions(select, mergedOptions);
  const dao = enforce ? EntitiesDAOFactory.default() : EntitiesDAOFactory.default().unrestricted();

  if (findOptions.withFiles) {
    const withFiles = await dao.find(filters, findOptions as FindWithFilesOptions);
    return withFiles as unknown as EntityWithFilesSchema[];
  }
  return dao.find(filters, findOptions);
};

export interface EntitiesFacade {
  /** Unrestricted read, no documents/attachments. */
  getUnrestricted(query: EntitiesQuery, select?: EntitiesSelect): Promise<EntityDBO[]>;
  /** Unrestricted read, with documents/attachments (unless `withoutDocuments`). */
  getUnrestrictedWithDocuments(
    query: EntitiesQuery,
    select?: EntitiesSelect,
    options?: EntitiesGetOptions
  ): Promise<EntityWithFilesSchema[]>;
  /** Enforced read; with documents/attachments by default, without when `withoutDocuments: true`. */
  get(
    query: EntitiesQuery,
    select: EntitiesSelect | undefined,
    options: EntitiesGetOptions & { withoutDocuments: true }
  ): Promise<EntityDBO[]>;
  get(
    query: EntitiesQuery,
    select?: EntitiesSelect,
    options?: EntitiesGetOptions
  ): Promise<EntityWithFilesSchema[]>;
  getById(id: string, language?: LanguageISO6391): Promise<EntityDBO | null>;
}

const facade: EntitiesFacade = {
  async getUnrestricted(query, select): Promise<EntityDBO[]> {
    return findEntities(query, select, undefined, {
      enforce: false,
      forceWithoutDocuments: true,
    }) as Promise<EntityDBO[]>;
  },

  async getUnrestrictedWithDocuments(
    query,
    select,
    options = {}
  ): Promise<EntityWithFilesSchema[]> {
    return findEntities(query, select, options, {
      enforce: false,
      forceWithoutDocuments: false,
    }) as Promise<EntityWithFilesSchema[]>;
  },

  // Implementation signature of an overloaded method; the union return is
  // narrowed by the overloads above. `any` avoids the impossible "return type
  // assignable to both EntityDBO[] and EntityWithFilesSchema[]" constraint.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async get(
    query: EntitiesQuery,
    select?: EntitiesSelect,
    options: EntitiesGetOptions = {}
  ): Promise<any> {
    return findEntities(query, select, options, {
      enforce: true,
      forceWithoutDocuments: false,
    });
  },

  async getById(id: string, language?: LanguageISO6391): Promise<EntityDBO | null> {
    const dao = EntitiesDAOFactory.default();
    return language ? dao.getBySharedId(id, language) : dao.getByInternalId(id);
  },
};

export default facade;
