/* eslint-disable max-lines */
/* eslint-disable no-param-reassign,max-statements */

import { generateNamesAndIds } from 'api/templates/utils';
import ID from 'shared/uniqueID';
import { propertyTypes } from 'shared/propertyTypes';
import date from 'api/utils/date';
import relationships from 'api/relationships/relationships';
import { search } from 'api/search';
import templates from 'api/templates/templates';
import translationsModel from 'api/i18n/translations';
import path from 'path';
import { PDF, files } from 'api/files';
import * as filesystem from 'api/files';
import dictionariesModel from 'api/thesauri/dictionariesModel';
import translate, { getContext } from 'shared/translate';
import { unique } from 'api/utils/filters';
import { AccessLevels } from 'shared/types/permissionSchema';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { validateEntity } from 'shared/types/entitySchema';
import { deleteFiles, deleteUploadedFiles } from '../files/filesystem';
import model from './entitiesModel';
import settings from '../settings';

/** Repopulate metadata object .label from thesauri and relationships. */
async function denormalizeMetadata(metadata, entity, template, dictionariesByKey) {
  if (!metadata) {
    return metadata;
  }

  const translation = (await translationsModel.get({ locale: entity.language }))[0];

  const resolveProp = async (key, value) => {
    if (!Array.isArray(value)) {
      throw new Error('denormalizeMetadata received non-array prop!');
    }
    const prop = template.properties.find(p => p.name === key);
    return Promise.all(
      value.map(async _elem => {
        const elem = { ..._elem };
        if (!elem.hasOwnProperty('value')) {
          throw new Error('denormalizeMetadata received non-value prop!');
        }
        if (!prop) {
          return elem;
        }
        if (prop.content && ['select', 'multiselect'].includes(prop.type)) {
          const dict = dictionariesByKey
            ? dictionariesByKey[prop.content]
            : await dictionariesModel.getById(prop.content);
          if (dict) {
            const context = getContext(translation, prop.content);
            const flattenValues = dict.values.reduce(
              (result, dv) => (dv.values ? result.concat(dv.values) : result.concat([dv])),
              []
            );
            const dictElem = flattenValues.find(v => v.id === elem.value);

            if (dictElem && dictElem.label) {
              elem.label = translate(context, dictElem.label, dictElem.label);
            }
          }
        }

        if (prop.type === 'relationship') {
          const partner = await model.getUnrestricted({
            sharedId: elem.value,
            language: entity.language,
          });

          if (partner && partner[0] && partner[0].title) {
            elem.label = partner[0].title;
            elem.icon = partner[0].icon;
            elem.type = partner[0].file ? 'document' : 'entity';
          }
        }
        return elem;
      })
    );
  };
  if (!template) {
    template = await templates.getById(entity.template);
    if (!template) {
      return metadata;
    }
  }
  return Object.keys(metadata).reduce(
    async (meta, prop) => ({
      ...(await meta),
      [prop]: await resolveProp(prop, metadata[prop]),
    }),
    Promise.resolve({})
  );
}

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
  return Promise.all(
    docLanguages.map(async d => {
      if (d._id.toString() === entity._id.toString()) {
        if (
          (entity.title && currentDoc.title !== entity.title) ||
          (entity.icon && !currentDoc.icon) ||
          (entity.icon && currentDoc.icon && currentDoc.icon._id !== entity.icon._id)
        ) {
          await this.renameRelatedEntityInMetadata({ ...currentDoc, ...entity });
        }
        const toSave = { ...entity };
        if (entity.metadata) {
          toSave.metadata = await denormalizeMetadata(entity.metadata, entity, template);
        }
        if (entity.suggestedMetadata) {
          toSave.suggestedMetadata = await denormalizeMetadata(
            entity.suggestedMetadata,
            entity,
            template
          );
        }
        return saveFunc(toSave);
      }

      if (entity.metadata) {
        d.metadata = d.metadata || entity.metadata;
        toSyncProperties.forEach(p => {
          d.metadata[p] = entity.metadata[p] || [];
        });
        d.metadata = await denormalizeMetadata(d.metadata, d, template);
      }

      if (entity.suggestedMetadata) {
        d.suggestedMetadata = d.suggestedMetadata || entity.suggestedMetadata;
        toSyncProperties.forEach(p => {
          d.suggestedMetadata[p] = entity.suggestedMetadata[p] || [];
        });
        d.suggestedMetadata = await denormalizeMetadata(d.suggestedMetadata, d, template);
      }

      if (typeof entity.published !== 'undefined') {
        d.published = entity.published;
      }

      if (typeof entity.template !== 'undefined') {
        d.template = entity.template;
      }

      if (typeof entity.generatedToc !== 'undefined') {
        d.generatedToc = entity.generatedToc;
      }
      return saveFunc(d);
    })
  );
}

async function createEntity(doc, languages, sharedId) {
  const template = await templates.getById(doc.template);
  return Promise.all(
    languages.map(async lang => {
      const langDoc = { ...doc };
      const avoidIdDuplication = doc._id && !lang.default;
      if (avoidIdDuplication) {
        delete langDoc._id;
      }
      langDoc.language = lang.key;
      langDoc.sharedId = sharedId;
      langDoc.metadata = await denormalizeMetadata(langDoc.metadata, langDoc, template);
      langDoc.suggestedMetadata = await denormalizeMetadata(
        langDoc.suggestedMetadata,
        langDoc,
        template
      );
      return model.save(langDoc);
    })
  );
}

function getEntityTemplate(doc, language) {
  return new Promise(resolve => {
    if (!doc.sharedId && !doc.template) {
      return resolve(null);
    }

    if (doc.template) {
      return templates.getById(doc.template).then(resolve);
    }

    return this.getById(doc.sharedId, language).then(storedDoc => {
      if (!storedDoc) {
        return null;
      }
      return templates.getById(storedDoc.template).then(resolve);
    });
  });
}

const uniqueMetadataObject = (elem, pos, arr) =>
  elem.value && arr.findIndex(e => e.value === elem.value) === pos;

function sanitize(doc, template) {
  if (!template) {
    return Object.assign(doc, { metadata: undefined });
  }

  if (!doc.metadata) {
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

const withDocuments = (entities, documentsFullText, withPdfInfo) =>
  Promise.all(
    entities.map(async entity => {
      const entityFiles = await files.get(
        { entity: entity.sharedId },
        (documentsFullText ? '+fullText ' : ' ') + (withPdfInfo ? '+pdfInfo' : '')
      );

      entity.documents = entityFiles.filter(f => f.type === 'document');
      entity.attachments = entityFiles.filter(f => f.type === 'attachment');
      return entity;
    })
  );

export default {
  denormalizeMetadata,
  sanitize,
  updateEntity,
  createEntity,
  getEntityTemplate,
  async save(_doc, { user, language }, updateRelationships = true, index = true) {
    await validateEntity(_doc);
    const doc = _doc;
    if (!doc.sharedId) {
      doc.user = user._id;
      doc.creationDate = date.currentUTC();
      doc.published = false;
    }

    const sharedId = doc.sharedId || ID();
    const [{ languages }, template, [defaultTemplate]] = await Promise.all([
      settings.get(),
      this.getEntityTemplate(doc, language),
      templates.get({ default: true }),
    ]);
    let docTemplate = template;
    doc.editDate = date.currentUTC();
    if (doc.sharedId) {
      await this.updateEntity(this.sanitize(doc, template), template);
    } else {
      if (!doc.template) {
        doc.template = defaultTemplate._id;
        doc.metadata = {};
        docTemplate = defaultTemplate;
      }
      await this.createEntity(this.sanitize(doc, docTemplate), languages, sharedId);
    }
    const [entity] = await this.getWithRelationships({ sharedId, language }, '+permissions');
    if (updateRelationships) {
      await relationships.saveEntityBasedReferences(entity, language);
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
    entity.metadata = await denormalizeMetadata(entity.metadata, entity, docTemplate);
    entity.suggestedMetadata = await denormalizeMetadata(
      entity.suggestedMetadata,
      entity,
      docTemplate
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

  getWithoutDocuments(query, select, options = {}) {
    return model.getUnrestricted(query, select, options);
  },

  async getUnrestrictedWithDocuments(query, select, options = {}) {
    const { documentsFullText, withPdfInfo, ...restOfOptions } = options;
    const entities = await model.getUnrestricted(query, select, restOfOptions);

    return withDocuments(entities, documentsFullText, withPdfInfo);
  },

  async getUnrestricted(query, select, options) {
    return model.getUnrestricted(query, select, options);
  },

  async get(query, select, options = {}) {
    const { documentsFullText, withPdfInfo, ...restOfOptions } = options;
    const entities = await model.get(query, select, restOfOptions);

    return withDocuments(entities, documentsFullText, withPdfInfo);
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

  getAllLanguages(sharedId) {
    return model.get({ sharedId });
  },

  countByTemplate(template, language) {
    const query = language ? { template, language } : { template };
    return model.count(query);
  },

  getByTemplate(template, language, onlyPublished = true, limit) {
    const query = {
      template,
      language,
      ...(onlyPublished ? { published: true } : {}),
    };
    const queryLimit = limit ? { limit } : {};
    return model.get(query, ['title', 'icon', 'file', 'sharedId'], queryLimit);
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
  async updateMetadataProperties(template, currentTemplate, language, reindex = true) {
    const actions = { $rename: {}, $unset: {} };
    template.properties = await generateNamesAndIds(template.properties);
    template.properties.forEach(property => {
      const currentProperty = currentTemplate.properties.find(p => p.id === property.id);
      if (currentProperty && currentProperty.name !== property.name) {
        actions.$rename[`metadata.${currentProperty.name}`] = `metadata.${property.name}`;
      }
    });
    currentTemplate.properties.forEach(property => {
      if (!template.properties.find(p => p.id === property.id)) {
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

    if (!template.properties.find(p => p.type === propertyTypes.relationship) && reindex) {
      return search.indexEntities({ template: template._id });
    }

    return this.bulkUpdateMetadataFromRelationships(
      { template: template._id, language },
      language,
      200,
      reindex
    );
  },

  async deleteFiles(deletedDocs) {
    await files.delete({ entity: { $in: deletedDocs.map(d => d.sharedId) } });
    const attachmentsToDelete = deletedDocs.reduce((filePaths, doc) => {
      if (doc.attachments) {
        doc.attachments.forEach(file =>
          filePaths.push({ filename: path.normalize(`${file.filename}`) })
        );
      }
      return filePaths;
    }, []);
    return deleteUploadedFiles(attachmentsToDelete);
  },

  deleteIndexes(sharedIds) {
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

  deleteMultiple(sharedIds) {
    return this.deleteIndexes(sharedIds).then(() =>
      sharedIds.reduce(
        (previousPromise, sharedId) => previousPromise.then(() => this.delete(sharedId, false)),
        Promise.resolve()
      )
    );
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
      this.deleteFiles(docs),
      this.deleteRelatedEntityFromMetadata(docs[0]),
    ]);
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

  /** Propagate the change of a thesaurus or related entity label to all entity metadata. */
  async renameInMetadata(valueId, changes, propertyContent, { types, restrictLanguage = null }) {
    const properties = (await templates.get({ 'properties.content': propertyContent }))
      .reduce((m, t) => m.concat(t.properties), [])
      .filter(p => types.includes(p.type))
      .filter(
        p => propertyContent && p.content && propertyContent.toString() === p.content.toString()
      );

    if (!properties.length) {
      return Promise.resolve();
    }

    await Promise.all(
      properties.map(property =>
        model.updateMany(
          { language: restrictLanguage, [`metadata.${property.name}.value`]: valueId },
          {
            $set: Object.keys(changes).reduce(
              (set, prop) => ({
                ...set,
                [`metadata.${property.name}.$[valueObject].${prop}`]: changes[prop],
              }),
              {}
            ),
          },
          { arrayFilters: [{ 'valueObject.value': valueId }] }
        )
      )
    );

    return search.indexEntities({
      $and: [
        {
          language: restrictLanguage,
        },
        {
          $or: properties.map(property => ({ [`metadata.${property.name}.value`]: valueId })),
        },
      ],
    });
  },

  /** Propagate the change of a thesaurus label to all entity metadata. */
  async renameThesaurusInMetadata(valueId, newLabel, thesaurusId, language) {
    await this.renameInMetadata(valueId, { label: newLabel }, thesaurusId, {
      types: [propertyTypes.select, propertyTypes.multiselect],
      restrictLanguage: language,
    });
  },

  /** Propagate the title change of a related entity to all entity metadata. */
  async renameRelatedEntityInMetadata(relatedEntity) {
    await this.renameInMetadata(
      relatedEntity.sharedId,
      { label: relatedEntity.title, icon: relatedEntity.icon },
      relatedEntity.template,
      {
        types: [propertyTypes.select, propertyTypes.multiselect, propertyTypes.relationship],
        restrictLanguage: relatedEntity.language,
      }
    );
  },

  async createThumbnail(entity) {
    const filePath = filesystem.uploadsPath(entity.file.filename);
    return new PDF({ filename: filePath }).createThumbnail(entity._id.toString());
  },

  async deleteLanguageFiles(entity) {
    const filesToDelete = [];
    filesToDelete.push(path.normalize(filesystem.uploadsPath(`${entity._id.toString()}.jpg`)));
    const sibilings = await this.get({ sharedId: entity.sharedId, _id: { $ne: entity._id } });
    if (entity.file) {
      const shouldUnlinkFile = sibilings.reduce(
        (should, sibiling) => should && !(sibiling.file.filename === entity.file.filename),
        true
      );
      if (shouldUnlinkFile) {
        filesToDelete.push(path.normalize(filesystem.uploadsPath(entity.file.filename)));
      }
    }
    if (entity.file) {
      await deleteFiles(filesToDelete);
    }
  },

  async generateNewEntitiesForLanguage(entities, language) {
    return Promise.all(
      entities.map(async _entity => {
        const { __v, _id, ...entity } = _entity;
        entity.language = language;
        entity.metadata = await this.denormalizeMetadata(entity.metadata, entity);
        entity.suggestedMetadata = await this.denormalizeMetadata(entity.suggestedMetadata, entity);
        return entity;
      })
    );
  },

  async addLanguage(language, limit = 50) {
    const [lanuageTranslationAlreadyExists] = await this.getUnrestrictedWithDocuments(
      { locale: language },
      null,
      {
        limit: 1,
      }
    );
    if (lanuageTranslationAlreadyExists) {
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
      const newSavedEntities = await this.saveMultiple(newLanguageEntities);
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

      return this.get({ language: locale }, null, { skip: offset, limit })
        .then(entities => Promise.all(entities.map(entity => this.deleteLanguageFiles(entity))))
        .then(() => deleteFilesByLanguage(offset + limit, totalRows));
    };

    return this.count({ language: locale })
      .then(totalRows => deleteFilesByLanguage(0, totalRows))
      .then(() => model.delete({ language: locale }))
      .then(() => search.deleteLanguage(locale));
  },

  count: model.count.bind(model),
};
