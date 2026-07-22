/* eslint-disable no-param-reassign,max-statements */

import relationships from '#api/relationships/relationships.js';
import templates from '#api/core/v1_layer/templates/templates.js';
import date from '#api/utils/date.js';
import { propertyTypes } from '#shared/propertyTypes.js';
import ID from '#shared/uniqueID.js';

import { FilesDAOFactory } from '#api/core/infrastructure/factories/FilesDAOFactory.js';
import { denormalizeMetadata } from './denormalize.js';
import model from './entitiesModel.js';
import { validateEntity } from './validateEntity.js';

async function getEntityTemplate(doc, language) {
  let template = null;
  if (doc.template) {
    template = await templates.getById(doc.template);
  } else if (doc.sharedId) {
    const storedDoc =
      (await this.getById(doc.sharedId, language)) || (await this.getById(doc.sharedId));
    if (storedDoc?.template) {
      template = await templates.getById(storedDoc.template);
    }
  }
  return template;
}

const uniqueMetadataObject = (elem, pos, arr) =>
  elem.value && arr.findIndex(e => e.value === elem.value) === pos;

function sanitize(doc, template) {
  if (!doc.metadata || !template) {
    return doc;
  }

  const metadata = template.properties.reduce((sanitizedMetadata, { type, name }) => {
    if (!sanitizedMetadata[name]) {
      return Object.assign(sanitizedMetadata, { [name]: [] });
    }

    if (
      [propertyTypes.multiselect, propertyTypes.relationship].includes(type) &&
      sanitizedMetadata[name]
    ) {
      return Object.assign(sanitizedMetadata, {
        [name]: sanitizedMetadata[name].filter(uniqueMetadataObject),
      });
    }

    if ([propertyTypes.date, propertyTypes.multidate].includes(type) && sanitizedMetadata[name]) {
      return Object.assign(sanitizedMetadata, {
        [name]: sanitizedMetadata[name].filter(value => value.value),
      });
    }

    if (
      [propertyTypes.daterange, propertyTypes.multidaterange].includes(type) &&
      sanitizedMetadata[name]
    ) {
      return Object.assign(sanitizedMetadata, {
        [name]: sanitizedMetadata[name].filter(value => value.value.from || value.value.to),
      });
    }

    if (
      type === propertyTypes.select &&
      (!sanitizedMetadata[name] || !sanitizedMetadata[name][0] || !sanitizedMetadata[name][0].value)
    ) {
      return Object.assign(sanitizedMetadata, { [name]: [] });
    }

    if (type === propertyTypes.numeric && typeof sanitizedMetadata[name]?.[0]?.value === 'string') {
      if (sanitizedMetadata[name][0].value === '') {
        delete sanitizedMetadata[name];
        return sanitizedMetadata;
      }

      return Object.assign(sanitizedMetadata, {
        [name]: [{ value: parseFloat(sanitizedMetadata[name][0].value) }],
      });
    }

    return sanitizedMetadata;
  }, doc.metadata);

  return Object.assign(doc, { metadata });
}

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
  denormalizeMetadata,
  sanitize,
  getEntityTemplate,
  async denormalize(_doc, { user, language }) {
    await validateEntity(_doc);
    const doc = _doc;
    if (!doc.sharedId) {
      doc.user = user._id;
      doc.creationDate = date.currentUTC();
      doc.published = false;
    }

    doc.sharedId = doc.sharedId || ID();
    const [template, defaultTemplate] = await Promise.all([
      this.getEntityTemplate(doc, language),
      templates.getDefaultTemplate(),
    ]);
    let docTemplate = template;
    if (!doc.template) {
      docTemplate = defaultTemplate;
    }
    const entity = this.sanitize(doc, docTemplate);
    entity.metadata = await denormalizeMetadata(entity.metadata, entity.language, docTemplate);

    return entity;
  },

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
