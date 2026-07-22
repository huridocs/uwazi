/* eslint-disable max-lines */
/* eslint-disable no-param-reassign,max-statements */

import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { files } from '#api/files/index.js';
import relationships from '#api/relationships/relationships.js';
import { search } from '#api/search/index.js';
import templates from '#api/core/v1_layer/templates/templates.js';
import date from '#api/utils/date.js';
import { propertyTypes } from '#shared/propertyTypes.js';
import ID from '#shared/uniqueID.js';

import { EntityFacade } from '#api/core/infrastructure/facades/EntitiesFacade.js';
import { FilesDAOFactory } from '#api/core/infrastructure/factories/FilesDAOFactory.js';
import { denormalizeMetadata } from './denormalize.js';
import model from './entitiesModel.js';
import { EntityDeletedEvent } from './events/EntityDeletedEvent.js';
import { savePropertySelections } from './metadataExtraction/saveSelections.js';
import { deleteRelatedNewRelationships } from './v2_support.js';
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

const asStringId = value => {
  if (value === null || value === undefined) {
    return value;
  }

  return typeof value === 'string' ? value : value.toString();
};

const normalizeIcon = icon => {
  if (!icon) {
    return icon;
  }

  return {
    ...icon,
    _id: icon._id === null ? null : asStringId(icon._id),
  };
};

const normalizeDocuments = (documents = []) =>
  documents
    .filter(document => document?.originalname)
    .map(document => ({
      ...document,
      _id: asStringId(document._id),
    }))
    .filter(document => document._id);

const normalizeAttachments = (attachments = []) =>
  attachments
    .filter(attachment => attachment?.originalname)
    .map(attachment => ({
      ...attachment,
      _id: attachment._id ? asStringId(attachment._id) : undefined,
    }));

const normalizeLegacyEntityForFacade = entity => ({
  ...entity,
  _id: asStringId(entity._id),
  user: asStringId(entity.user),
  template: asStringId(entity.template),
  icon: normalizeIcon(entity.icon),
  documents: normalizeDocuments(entity.documents),
  attachments: normalizeAttachments(entity.attachments),
});

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
  async save(_doc, { user, language }) {
    await validateEntity(_doc);
    await savePropertySelections(_doc);
    const doc = _doc;

    if (!doc.sharedId) {
      doc.user = user._id;
      doc.creationDate = date.currentUTC();
      doc.published = false;
    }
    let sharedId = doc.sharedId || ID();
    const template = await this.getEntityTemplate(doc, language);
    let docTemplate = template;
    doc.editDate = date.currentUTC();

    const isUpdate = Boolean(doc.sharedId);

    if (isUpdate) {
      const docLanguage = doc.language || language;
      const [languageDocWithFiles] = await this.getUnrestrictedWithDocuments(
        { sharedId: doc.sharedId, language: docLanguage },
        '+permissions'
      );
      const [anyLanguageDocWithFiles] = await this.getUnrestrictedWithDocuments(
        { sharedId: doc.sharedId },
        '+permissions'
      );
      const currentDoc = languageDocWithFiles || anyLanguageDocWithFiles;
      if (!currentDoc) {
        throw new Error(`entity does not exists: ${doc.sharedId}`);
      }

      const sanitized = this.sanitize(doc, template);
      const merged = {
        ...currentDoc,
        ...sanitized,
        _id: sanitized._id || currentDoc._id,
        sharedId: sanitized.sharedId || currentDoc.sharedId,
        language: sanitized.language || currentDoc.language || docLanguage,
        title: sanitized.title || currentDoc.title,
      };
      await EntityFacade.update(
        normalizeLegacyEntityForFacade(merged),
        merged.language || language
      );
    } else {
      const defaultTemplate = await templates.getDefaultTemplate();

      if (!doc.template) {
        doc.template = defaultTemplate?._id;
        docTemplate = defaultTemplate;
      }
      if (doc._id) {
        delete doc._id;
      }
      doc.metadata = doc.metadata || {};
      const createdEntity = await EntityFacade.create(
        normalizeLegacyEntityForFacade(this.sanitize(doc, docTemplate)),
        language
      );
      sharedId = createdEntity.sharedId;
    }

    const [entity] = await this.getUnrestrictedWithDocuments(
      { sharedId, language },
      '+permissions'
    );

    return entity;
  },

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

  /** Handle property deletion and renames. */
  async deleteIndexes(sharedIds) {
    const deleteIndexBatch = (offset, totalRows) => {
      const limit = 200;
      if (offset >= totalRows) {
        return Promise.resolve();
      }
      return this.get({ sharedId: { $in: sharedIds } }, null, { skip: offset, limit })
        .then(entities => search.bulkDelete(entities))
        .then(() => deleteIndexBatch(offset + limit, totalRows));
    };

    return this.count({ sharedId: { $in: sharedIds } }).then(totalRows =>
      deleteIndexBatch(0, totalRows)
    );
  },

  /**
   * @deprecated
   * This method is deprecated and should not be used anymore.
   */
  async delete(sharedId, deleteIndex = true) {
    const docs = await this.get({ sharedId });
    if (!docs.length) {
      return docs;
    }
    if (deleteIndex) {
      await Promise.all(docs.map(doc => search.delete(doc)));
    }
    try {
      await model.delete({ sharedId });
    } catch (e) {
      await search.indexEntities({ sharedId }, '+fullText');
      throw e;
    }
    await Promise.all([
      relationships.delete({ entity: sharedId }, null, false),
      files.delete({ entity: sharedId }),
      this.deleteRelatedEntityFromMetadata(docs[0]),
    ]);

    await applicationEventsBus.emit(new EntityDeletedEvent({ entity: docs }));

    await deleteRelatedNewRelationships(sharedId);

    return docs;
  },

  async removeValuesFromEntities(properties, template) {
    const query = { template, $or: [] };
    const changes = {};

    properties.forEach(prop => {
      const propQuery = {};
      propQuery[`metadata.${prop}`] = { $exists: true };
      query.$or.push(propQuery);
      changes[`metadata.${prop}`] = [];
    });

    const entitiesToReindex = await this.get(query, { _id: 1 });
    await model.updateMany(query, { $set: changes });
    return search.indexEntities({ _id: { $in: entitiesToReindex.map(e => e._id.toString()) } });
  },

  /** Propagate the deletion metadata.value id to all entity metadata. */
  async deleteFromMetadata(deletedId, propertyContent, propTypes) {
    const contentOrEmpty = [propertyContent, ''];
    const allTemplates = await templates.getByContentsOrUnrestrictedRelationship(contentOrEmpty);
    const allProperties = allTemplates.reduce((m, t) => m.concat(t.properties), []);
    const properties = allProperties.filter(p => propTypes.includes(p.type));
    const query = { $or: [] };
    const changes = {};
    const contentMatches = p =>
      (p.content && p.content.toString() === propertyContent.toString()) ||
      p.content === '' ||
      (p.type === propertyTypes.relationship && typeof p.content === 'undefined');
    query.$or = properties
      .filter(p => propertyContent && contentMatches(p))
      .map(property => {
        const p = {};
        p[`metadata.${property.name}.value`] = deletedId;
        changes[`metadata.${property.name}`] = { value: deletedId };
        return p;
      });
    if (!query.$or.length) {
      return;
    }
    const entities = await this.get(query, { _id: 1 });
    await model.updateMany(query, { $pull: changes });
    if (entities.length > 0) {
      await search.indexEntities({ _id: { $in: entities.map(e => e._id.toString()) } }, null, 1000);
    }
  },

  /** Propagate the deletion of a related entity to all entity metadata. */
  async deleteRelatedEntityFromMetadata(deletedEntity) {
    await this.deleteFromMetadata(deletedEntity.sharedId, deletedEntity.template, [
      propertyTypes.select,
      propertyTypes.multiselect,
      propertyTypes.relationship,
    ]);
  },

  count: model.count.bind(model),
};
