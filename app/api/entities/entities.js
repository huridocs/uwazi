/* eslint-disable no-param-reassign */

import { EntitiesDAOFactory } from '#api/core/infrastructure/factories/EntitiesDAOFactory.js';
import { FilesDAOFactory } from '#api/core/infrastructure/factories/FilesDAOFactory.js';
import model from './entitiesModel.js';

const withDocuments = async (entities, documentsFullText) => {
  const sharedIds = entities.map(entity => entity.sharedId);
  const allFiles = await FilesDAOFactory.default().getByEntitySharedIds(sharedIds, {
    projection: documentsFullText ? {} : { fullText: 0 },
  });
  const idFileMap = new Map();
  allFiles.forEach(file => {
    if (idFileMap.has(file.entity)) {
      idFileMap.get(file.entity).push(file);
    } else {
      idFileMap.set(file.entity, [file]);
    }
  });
  const result = entities.map(entity => {
    // intentionally passing copies
    // consumers of the result do not handle it immutably (sometimes even delete data)
    // changes result in possibly breaking side-effects when file objects are shared between entities
    const entityFiles = idFileMap.has(entity.sharedId)
      ? idFileMap.get(entity.sharedId).map(file => ({ ...file }))
      : [];
    entity.documents = entityFiles.filter(f => f.type === 'document');
    entity.attachments = entityFiles.filter(f => f.type === 'attachment');
    return entity;
  });
  return result;
};

const extendSelect = select => {
  if (!select) {
    return select;
  }
  if (typeof select === 'string') {
    return select.includes('+') ? `${select} +sharedId` : `${select} sharedId`;
  }
  if (Array.isArray(select)) {
    return select.concat(['sharedId']);
  }
  return Object.keys(select).length > 0 ? { sharedId: 1, ...select } : select;
};

export default {
  async getUnrestricted(query, select, options) {
    const extendedSelect = extendSelect(select);
    const entities = await model.getUnrestricted(query, extendedSelect, options);
    return entities;
  },

  async getUnrestrictedWithDocuments(query, select, options = {}) {
    const match = {};
    if (query.sharedId !== undefined) {
      if (query.sharedId.$in) {
        match.sharedIds = query.sharedId.$in;
      } else {
        match.sharedId = query.sharedId;
      }
    }
    if (query.language) {
      match.language = query.language;
    }

    const entities = await EntitiesDAOFactory.default()
      .unrestricted()
      .getWithFiles(
        match,
        Array.isArray(select) && select.length ? { select } : undefined
      );

    return options.limit ? entities.slice(0, options.limit) : entities;
  },

  async get(query, select, options = {}) {
    const { withoutDocuments, documentsFullText, ...restOfOptions } = options;
    const extendedSelect = withoutDocuments ? select : extendSelect(select);
    const entities = await model.get(query, extendedSelect, restOfOptions);

    return withoutDocuments ? entities : withDocuments(entities, documentsFullText);
  },

  async getById(id, language) {
    const dao = EntitiesDAOFactory.default();
    return language ? dao.getBySharedId(id, language) : dao.getByInternalId(id);
  },
};
