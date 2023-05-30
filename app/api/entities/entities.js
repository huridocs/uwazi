/* eslint-disable max-lines */
/* eslint-disable no-param-reassign,max-statements */

import { applicationEventsBus } from 'api/eventsbus';
import { PDF, files } from 'api/files';
import * as filesystem from 'api/files';
import { permissionsContext } from 'api/permissions/permissionsContext';
import relationships from 'api/relationships/relationships';
import { search } from 'api/search';
import templates from 'api/templates/templates';
import { generateNames } from 'api/templates/utils';
import date from 'api/utils/date';
import { unique } from 'api/utils/filters';
import { AccessLevels } from 'shared/types/permissionSchema';
import { propertyTypes } from 'shared/propertyTypes';
import ID from 'shared/uniqueID';

import { denormalizeMetadata, denormalizeRelated } from './denormalize';
import model from './entitiesModel';
import { EntityUpdatedEvent } from './events/EntityUpdatedEvent';
import { EntityDeletedEvent } from './events/EntityDeletedEvent';
import { saveSelections } from './metadataExtraction/saveSelections';
import {
  deleteRelatedNewRelationships,
  denormalizeAfterEntityUpdate,
  ignoreNewRelationshipsMetadata,
  denormalizeAfterEntityCreation,
  assignNewRelationshipFieldsValues,
} from './v2_support';
import { validateEntity } from './validateEntity';
import settings from '../settings';

const FIELD_TYPES_TO_SYNC = [
  propertyTypes.select,
  propertyTypes.multiselect,
  propertyTypes.date,
  propertyTypes.multidate,
  propertyTypes.multidaterange,
  propertyTypes.nested,
  propertyTypes.relationship,
  propertyTypes.relationship,
  propertyTypes.geolocation,
  propertyTypes.numeric,
];

async function updateEntity(entity, _template, unrestricted = false) {
  const docLanguages = await this.getAllLanguages(entity.sharedId);

  if (
    docLanguages[0].template &&
    entity.template &&
    docLanguages[0].template.toString() !== entity.template.toString()
  ) {
    await Promise.all([
      this.deleteRelatedEntityFromMetadata(docLanguages[0]),
      relationships.delete({ entity: entity.sharedId }, null, false),
    ]);
  }
  const template = _template || { properties: [] };
  const toSyncProperties = template.properties
    .filter(p => p.type.match(FIELD_TYPES_TO_SYNC.join('|')))
    .map(p => p.name);
  const currentDoc = docLanguages.find(d => d._id.toString() === entity._id.toString());
  const saveFunc = !unrestricted ? model.save : model.saveUnrestricted;

  const thesauriByKey = await templates.getRelatedThesauri(template);

  const result = await Promise.all(
    docLanguages.map(async d => {
      if (d._id.toString() === entity._id.toString()) {
        const toSave = { ...entity };
        delete toSave.published;
        delete toSave.permissions;

        if (entity.metadata) {
          toSave.metadata = await denormalizeMetadata(
            entity.metadata,
            d.language,
            template._id.toString(),
            thesauriByKey
          );
        }

        if (entity.suggestedMetadata) {
          toSave.suggestedMetadata = await denormalizeMetadata(
            entity.suggestedMetadata,
            entity.language,
            template._id.toString(),
            thesauriByKey
          );
        }

        ignoreNewRelationshipsMetadata(currentDoc, toSave, template);

        const fullEntity = { ...currentDoc, ...toSave };

        if (template._id) {
          await denormalizeRelated(fullEntity, template, currentDoc);
        }
        return saveFunc(toSave);
      }

      const toSave = { ...d };

      await ['metadata', 'suggestedMetadata'].reduce(async (prev, metadataParent) => {
        await prev;
        if (entity[metadataParent]) {
          toSave[metadataParent] = { ...(toSave[metadataParent] || entity[metadataParent]) };
          toSyncProperties.forEach(p => {
            toSave[metadataParent][p] = entity[metadataParent][p] || [];
          });
          toSave[metadataParent] = await denormalizeMetadata(
            toSave[metadataParent],
            toSave.language,
            template._id.toString(),
            thesauriByKey
          );
        }
      }, Promise.resolve());

      if (typeof entity.template !== 'undefined') {
        toSave.template = entity.template;
      }

      if (typeof entity.generatedToc !== 'undefined') {
        toSave.generatedToc = entity.generatedToc;
      }

      if (template._id) {
        await denormalizeRelated(toSave, template, d);
      }

      return saveFunc(toSave);
    })
  );

  await denormalizeAfterEntityUpdate(entity);

  await applicationEventsBus.emit(
    new EntityUpdatedEvent({
      before: docLanguages,
      after: result,
      targetLanguageKey: entity.language,
    })
  );

  return result;
}

async function createEntity(doc, languages, sharedId, docTemplate) {
  if (!docTemplate) docTemplate = await templates.getById(doc.template);
  const newRelationshipPropertyNames =
    docTemplate.properties.filter(p => p.type === propertyTypes.newRelationship).map(p => p.name) ||
    [];
  const thesauriByKey = await templates.getRelatedThesauri(docTemplate);
  const result = await Promise.all(
    languages.map(async lang => {
      const langDoc = { ...doc };
      const avoidIdDuplication = doc._id && !lang.default;
      if (avoidIdDuplication) {
        delete langDoc._id;
      }
      langDoc.language = lang.key;
      langDoc.sharedId = sharedId;
      langDoc.metadata = await denormalizeMetadata(
        langDoc.metadata,
        langDoc.language,
        langDoc.template.toString(),
        thesauriByKey
      );

      langDoc.suggestedMetadata = await denormalizeMetadata(
        langDoc.suggestedMetadata,
        langDoc.language,
        langDoc.template.toString(),
        thesauriByKey
      );

      langDoc.obsoleteMetadata = newRelationshipPropertyNames;

      return model.save(langDoc);
    })
  );

  await Promise.all(result.map(r => denormalizeAfterEntityCreation(r)));
  return result;
}

async function getEntityTemplate(doc, language) {
  let template = null;
  if (doc.template) {
    template = await templates.getById(doc.template);
  } else if (doc.sharedId) {
    const storedDoc = await this.getById(doc.sharedId, language);
    if (storedDoc) {
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

    return sanitizedMetadata;
  }, doc.metadata);

  return Object.assign(doc, { metadata });
}

function updateMetadataWithDiff(metadata, diffMetadata) {
  if (!diffMetadata) {
    return metadata;
  }
  const newMetadata = { ...metadata };
  Object.keys(diffMetadata).forEach(p => {
    const dm = diffMetadata[p];
    const toAdd = dm.added || [];
    const toRemove = dm.removed || [];
    if (!dm || toAdd.length + toRemove.length === 0) {
      return;
    }
    if (!newMetadata[p] || !newMetadata[p].length) {
      newMetadata[p] = toAdd;
      return;
    }
    newMetadata[p] = [
      ...newMetadata[p].filter(v => !toRemove.map(vr => vr.value).includes(v.value)),
      ...toAdd.filter(va => !newMetadata[p].map(v => v.value).includes(va.value)),
    ];
  });
  return newMetadata;
}

const validateWritePermissions = (ids, entitiesToUpdate) => {
  const user = permissionsContext.getUserInContext();
  if (!['admin', 'editor'].includes(user.role)) {
    const userIds = user.groups.map(g => g._id.toString());
    userIds.push(user._id.toString());

    const allowedEntitiesToUpdate = entitiesToUpdate.filter(e => {
      const writeGranted = (e.permissions || [])
        .filter(p => p.level === AccessLevels.WRITE)
        .map(p => p.refId)
        .filter(id => userIds.includes(id));
      return writeGranted.length > 0;
    });
    const uniqueIdsLength = allowedEntitiesToUpdate.map(e => e.sharedId).filter(unique).length;
    if (uniqueIdsLength !== ids.length) {
      throw Error('Have not permissions granted to update the requested entities');
    }
  }
};

const withDocuments = async (entities, documentsFullText) => {
  const sharedIds = entities.map(entity => entity.sharedId);
  const allFiles = await files.get(
    { entity: { $in: sharedIds } },
    documentsFullText ? '+fullText ' : ' '
  );
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

const reindexEntitiesByTemplate = async (template, options) => {
  const templateHasRelationShipProperty = template.properties?.find(
    p => p.type === propertyTypes.relationship
  );
  if (options.reindex && (options.generatedIdAdded || !templateHasRelationShipProperty)) {
    return search.indexEntities({ template: template._id });
  }
  return Promise.resolve();
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
  updateEntity,
  createEntity,
  getEntityTemplate,
  async save(_doc, { user, language }, options = {}) {
    const { updateRelationships = true, index = true, includeDocuments = true } = options;
    await validateEntity(_doc);
    await saveSelections(_doc);
    const doc = _doc;

    if (!doc.sharedId) {
      doc.user = user._id;
      doc.creationDate = date.currentUTC();
      doc.published = false;
    }
    const sharedId = doc.sharedId || ID();
    const template = await this.getEntityTemplate(doc, language);
    let docTemplate = template;
    doc.editDate = date.currentUTC();

    if (doc.sharedId) {
      await this.updateEntity(this.sanitize(doc, template), template);
    } else {
      const [{ languages }, [defaultTemplate]] = await Promise.all([
        settings.get(),
        templates.get({ default: true }),
      ]);

      if (!doc.template) {
        doc.template = defaultTemplate._id;
        docTemplate = defaultTemplate;
      }
      doc.metadata = doc.metadata || {};
      await this.createEntity(this.sanitize(doc, docTemplate), languages, sharedId, docTemplate);
    }

    const [entity] = includeDocuments
      ? await this.getUnrestrictedWithDocuments({ sharedId, language }, '+permissions')
      : await this.getUnrestricted({ sharedId, language }, '+permissions');

    if (updateRelationships) {
      await relationships.saveEntityBasedReferences(entity, language, docTemplate);
    }

    if (index) {
      await search.indexEntities({ sharedId }, '+fullText');
    }

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
    const [template, [defaultTemplate]] = await Promise.all([
      this.getEntityTemplate(doc, language),
      templates.get({ default: true }),
    ]);
    let docTemplate = template;
    if (!doc.template) {
      doc.template = defaultTemplate._id;
      doc.metadata = {};
      docTemplate = defaultTemplate;
    }
    const entity = this.sanitize(doc, docTemplate);
    entity.metadata = await denormalizeMetadata(
      entity.metadata,
      entity.language,
      entity.template.toString()
    );
    entity.suggestedMetadata = await denormalizeMetadata(
      entity.suggestedMetadata,
      entity.language,
      entity.template.toString()
    );
    return entity;
  },

  /** Bulk rebuild relationship-based metadata objects as {value = id, label: title}. */
  async bulkUpdateMetadataFromRelationships(query, language, limit = 200, reindex = true) {
    const process = async (offset, totalRows) => {
      if (offset >= totalRows) {
        return;
      }

      const entities = await this.get(query, 'sharedId', { skip: offset, limit });
      await this.updateMetdataFromRelationships(
        entities.map(entity => entity.sharedId),
        language,
        reindex
      );
      await process(offset + limit, totalRows);
    };
    const totalRows = await this.count(query);
    await process(0, totalRows);
  },

  async getWithoutDocuments(query, select, options = {}) {
    const entities = await model.getUnrestricted(query, select, options);
    await assignNewRelationshipFieldsValues(entities);
    return entities;
  },

  async getUnrestricted(query, select, options) {
    const extendedSelect = extendSelect(select);
    const entities = await model.getUnrestricted(query, extendedSelect, options);
    await assignNewRelationshipFieldsValues(entities);
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
    await assignNewRelationshipFieldsValues(entities);

    return withoutDocuments ? entities : withDocuments(entities, documentsFullText);
  },

  async getWithRelationships(query, select, pagination) {
    const entities = await this.get(query, select, pagination);
    return Promise.all(
      entities.map(async entity => {
        entity.relations = await relationships.getByDocument(entity.sharedId, entity.language);
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
    if (doc) await assignNewRelationshipFieldsValues([doc]);
    return doc;
  },

  async saveMultiple(docs) {
    await docs.reduce(async (prev, doc) => {
      await prev;
      await validateEntity(doc);
    }, Promise.resolve());

    const response = await model.saveMultiple(docs);
    await search.indexEntities({ _id: { $in: response.map(d => d._id) } }, '+fullText');
    return response;
  },

  async multipleUpdate(ids, values, params) {
    const { diffMetadata = {}, ...pureValues } = values;

    const entitiesToUpdate = await this.getUnrestricted({ sharedId: { $in: ids } }, '+permissions');
    validateWritePermissions(ids, entitiesToUpdate);
    await Promise.all(
      ids.map(async id => {
        const entity = await entitiesToUpdate.find(
          e => e.sharedId === id && e.language === params.language
        );

        if (entity) {
          await this.save(
            {
              ...entity,
              ...pureValues,
              metadata: updateMetadataWithDiff(
                { ...entity.metadata, ...pureValues.metadata },
                diffMetadata
              ),
              permissions: entity.permissions || [],
            },
            params,
            true,
            false
          );
        }
      })
    );

    await search.indexEntities({ sharedId: { $in: ids } });
    return this.get({ sharedId: { $in: ids }, language: params.language });
  },

  async getAllLanguages(sharedId) {
    const entities = await model.get({ sharedId });
    await assignNewRelationshipFieldsValues(entities);
    return entities;
  },

  countByTemplate(template, language) {
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

  /** Rebuild relationship-based metadata objects as {value = id, label: title}. */
  async updateMetdataFromRelationships(entities, language, reindex = true) {
    const entitiesToReindex = [];
    const _templates = await templates.get();
    await Promise.all(
      entities.map(async entityId => {
        const entity = await this.getById(entityId, language);
        const relations = await relationships.getByDocument(entityId, language);

        if (entity && entity.template) {
          entity.metadata = entity.metadata || {};
          const template = _templates.find(t => t._id.toString() === entity.template.toString());

          const relationshipProperties = template.properties.filter(p => p.type === 'relationship');
          relationshipProperties.forEach(property => {
            const relationshipsGoingToThisProperty = relations.filter(
              r =>
                r.template &&
                r.template.toString() === property.relationType.toString() &&
                (!property.content || r.entityData.template.toString() === property.content)
            );

            entity.metadata[property.name] = relationshipsGoingToThisProperty.map(r => ({
              value: r.entity,
              label: r.entityData.title,
            }));
          });
          if (relationshipProperties.length) {
            entitiesToReindex.push(entity.sharedId);
            await this.updateEntity(this.sanitize(entity, template), template, true);
          }
        }
      })
    );

    if (reindex) {
      await search.indexEntities({ sharedId: { $in: entitiesToReindex } });
    }
  },

  /** Handle property deletion and renames. */
  async updateMetadataProperties(
    template,
    currentTemplate,
    language,
    options = { reindex: true, generatedIdAdded: false }
  ) {
    const actions = { $rename: {}, $unset: {} };
    template.properties = await generateNames(template.properties);
    template.properties.forEach(property => {
      const currentProperty = currentTemplate.properties.find(
        p => p._id.toString() === (property._id || '').toString()
      );
      if (currentProperty && currentProperty.name !== property.name) {
        actions.$rename[`metadata.${currentProperty.name}`] = `metadata.${property.name}`;
      }
    });

    currentTemplate.properties.forEach(property => {
      if (!template.properties.find(p => (p._id || '').toString() === property._id.toString())) {
        actions.$unset[`metadata.${property.name}`] = '';
      }
    });

    const noneToUnset = !Object.keys(actions.$unset).length;
    const noneToRename = !Object.keys(actions.$rename).length;

    if (noneToUnset) {
      delete actions.$unset;
    }
    if (noneToRename) {
      delete actions.$rename;
    }

    if (actions.$unset || actions.$rename) {
      await model.updateMany({ template: template._id }, actions);
    }

    await reindexEntitiesByTemplate(template, options);
    return this.bulkUpdateMetadataFromRelationships(
      { template: template._id, language },
      language,
      200,
      options.reindex
    );
  },

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

  async deleteMultiple(sharedIds) {
    let entitiesDeleted = [];

    try {
      // eslint-disable-next-line no-restricted-syntax
      for (const sharedId of sharedIds) {
        // eslint-disable-next-line no-await-in-loop
        entitiesDeleted = entitiesDeleted.concat(await this.delete(sharedId, false));
      }
    } catch (e) {
      await search.bulkDelete(entitiesDeleted);
      throw e;
    }

    await search.bulkDelete(entitiesDeleted);
  },

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
    const allTemplates = await templates.get({ 'properties.content': propertyContent });
    const allProperties = allTemplates.reduce((m, t) => m.concat(t.properties), []);
    const properties = allProperties.filter(p => propTypes.includes(p.type));
    const query = { $or: [] };
    const changes = {};
    query.$or = properties
      .filter(
        p => propertyContent && p.content && propertyContent.toString() === p.content.toString()
      )
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

  /** Propagate the deletion of a thesaurus entry to all entity metadata. */
  async deleteThesaurusFromMetadata(deletedId, thesaurusId) {
    await this.deleteFromMetadata(deletedId, thesaurusId, [
      propertyTypes.select,
      propertyTypes.multiselect,
    ]);
  },

  /** Propagate the deletion of a related entity to all entity metadata. */
  async deleteRelatedEntityFromMetadata(deletedEntity) {
    await this.deleteFromMetadata(deletedEntity.sharedId, deletedEntity.template, [
      propertyTypes.select,
      propertyTypes.multiselect,
      propertyTypes.relationship,
    ]);
  },

  async createThumbnail(entity) {
    const filePath = filesystem.uploadsPath(entity.file.filename);
    return new PDF({ filename: filePath }).createThumbnail(entity._id.toString());
  },

  async generateNewEntitiesForLanguage(entities, language) {
    return Promise.all(
      entities.map(async _entity => {
        const { __v, _id, ...entity } = _entity;
        entity.language = language;
        entity.metadata = await this.denormalizeMetadata(
          entity.metadata,
          language,
          entity.template?.toString()
        );
        entity.suggestedMetadata = await this.denormalizeMetadata(
          entity.suggestedMetadata,
          language,
          entity.template?.toString()
        );
        return entity;
      })
    );
  },

  async addLanguage(language, limit = 50) {
    const [languageTranslationAlreadyExists] = await this.getUnrestrictedWithDocuments(
      { locale: language },
      null,
      {
        limit: 1,
      }
    );
    if (languageTranslationAlreadyExists) {
      return;
    }

    const { languages } = await settings.get();

    const defaultLanguage = languages.find(l => l.default).key;
    const duplicate = async (offset, totalRows) => {
      if (offset >= totalRows) {
        return;
      }

      const entities = await this.getUnrestrictedWithDocuments(
        { language: defaultLanguage },
        '+permissions',
        {
          skip: offset,
          limit,
        }
      );
      const newLanguageEntities = await this.generateNewEntitiesForLanguage(entities, language);
      const newSavedEntities = await model.saveMultiple(newLanguageEntities);
      await search.indexEntities({ _id: { $in: newSavedEntities.map(d => d._id) } }, '+fullText');
      await newSavedEntities.reduce(async (previous, entity) => {
        await previous;
        if (entity.file) {
          return this.createThumbnail(entity);
        }
        return Promise.resolve();
      }, Promise.resolve());
      await duplicate(offset + limit, totalRows);
    };

    const totalRows = await this.count({ language: defaultLanguage });
    await duplicate(0, totalRows);
  },

  async removeLanguage(locale) {
    const deleteFilesByLanguage = (offset, totalRows) => {
      const limit = 200;
      if (offset >= totalRows) {
        return Promise.resolve();
      }

      return this.get({ language: locale }, null, { skip: offset, limit }).then(() =>
        deleteFilesByLanguage(offset + limit, totalRows)
      );
    };

    return this.count({ language: locale })
      .then(totalRows => deleteFilesByLanguage(0, totalRows))
      .then(() => model.delete({ language: locale }))
      .then(() => search.deleteLanguage(locale));
  },

  count: model.count.bind(model),
};
