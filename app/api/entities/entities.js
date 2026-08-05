/* eslint-disable no-param-reassign */

import relationships from '#api/relationships/relationships.js';
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
  async getWithoutDocuments(query, select, options = {}) {
    const entities = await model.getUnrestricted(query, select, options);
    return entities;
  },

  async getUnrestricted(query, select, options) {
    const extendedSelect = extendSelect(select);
    const entities = await model.getUnrestricted(query, extendedSelect, options);
    return entities;
  },

  async getUnrestrictedWithDocuments(query, select, options = {}) {
    const { documentsFullText, ...restOfOptions } = options;
    const entities = await this.getUnrestricted(query, select, restOfOptions);
    return withDocuments(entities, documentsFullText);
  },

  async get(query, select, options = {}) {
    const { withoutDocuments, documentsFullText, ...restOfOptions } = options;
    const extendedSelect = withoutDocuments ? select : extendSelect(select);
    const entities = await model.get(query, extendedSelect, restOfOptions);

    return withoutDocuments ? entities : withDocuments(entities, documentsFullText);
  },

  async getWithRelationships(query, select, pagination) {
    const entities = await this.get(query, select, pagination);
    return Promise.all(
      entities.map(async entity => {
        entity.relations = await relationships.getByDocument(
          entity.sharedId,
          entity.language,
          undefined,
          undefined,
          undefined,
          false
        );
        return entity;
      })
    );
  },

  async getById(sharedId, language) {
    let doc;
    if (!language) {
      doc = await model.getById(sharedId);
    } else {
      doc = await model.get({ sharedId, language }).then(result => result[0]);
    }
    return doc;
  },

  async getAllLanguages(sharedId, options = {}) {
    const entities = await model.get({ sharedId }, null, options);
    return entities;
  },

  async countByTemplate(template, language) {
    const query = language ? { template, language } : { template };
    return model.count(query);
  },

  async getByTemplate(template, language, limit, onlyPublished = true) {
    const query = {
      template,
      language,
      ...(onlyPublished ? { published: true } : {}),
    };
    const queryLimit = limit ? { limit } : {};
    const entities = await model.get(query, ['title', 'icon', 'file', 'sharedId'], queryLimit);
    return entities;
  },

  count: model.count.bind(model),
};
