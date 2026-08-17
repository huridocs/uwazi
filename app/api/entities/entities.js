/* eslint-disable no-param-reassign */

import { EntitiesDAOFactory } from '#api/core/infrastructure/factories/EntitiesDAOFactory.js';

const selectToArray = select => {
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

const translateQueryToFilters = query => {
  const safeQuery = query || {};
  const filters = {};
  if (safeQuery._id) {
    filters._id = safeQuery._id.toString();
  }
  if (safeQuery.sharedId !== undefined) {
    if (safeQuery.sharedId.$in) {
      filters.sharedIds = safeQuery.sharedId.$in;
    } else {
      filters.sharedId = safeQuery.sharedId;
    }
  }
  if (safeQuery.language) {
    filters.language = safeQuery.language;
  }
  if (safeQuery.template) {
    filters.template = safeQuery.template.toString();
  }
  if (safeQuery.title) {
    filters.title = safeQuery.title;
  }
  return filters;
};

const buildFindOptions = (select, options = {}) => {
  const fields = selectToArray(select);
  const findOptions = {};
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
  async getUnrestricted(query, select, options = {}) {
    const filters = translateQueryToFilters(query);
    if (filters.sharedIds && filters.sharedIds.length === 0) {
      return [];
    }
    return EntitiesDAOFactory.default()
      .unrestricted()
      .find(filters, buildFindOptions(select, { ...options, withoutDocuments: true }));
  },

  async getUnrestrictedWithDocuments(query, select, options = {}) {
    const filters = translateQueryToFilters(query);
    if (filters.sharedIds && filters.sharedIds.length === 0) {
      return [];
    }
    return EntitiesDAOFactory.default()
      .unrestricted()
      .find(filters, buildFindOptions(select, options));
  },

  async get(query, select, options = {}) {
    const filters = translateQueryToFilters(query);
    if (filters.sharedIds && filters.sharedIds.length === 0) {
      return [];
    }
    return EntitiesDAOFactory.default().find(filters, buildFindOptions(select, options));
  },

  async getById(id, language) {
    const dao = EntitiesDAOFactory.default();
    return language ? dao.getBySharedId(id, language) : dao.getByInternalId(id);
  },
};
