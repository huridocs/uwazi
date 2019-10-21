import { generateNamesAndIds } from 'api/templates/utils';
import ID from 'shared/uniqueID';
import date from 'api/utils/date.js';
import relationships from 'api/relationships/relationships';
import createError from 'api/utils/Error';
import search from 'api/search/search';
import templates from 'api/templates/templates';
import path from 'path';
import PDF from 'api/upload/PDF';
import paths from 'api/config/paths';

import { deleteFiles } from '../utils/files.js';
import model from './entitiesModel';
import settings from '../settings';

function updateEntity(entity, _template) {
  return this.getAllLanguages(entity.sharedId)
  .then((docLanguages) => {
    if (docLanguages[0].template && entity.template && docLanguages[0].template.toString() !== entity.template.toString()) {
      return Promise.all([
        this.deleteEntityFromMetadata(docLanguages[0].sharedId, docLanguages[0].template),
        relationships.delete({ entity: entity.sharedId }, null, false)
      ])
      .then(() => docLanguages);
    }
    return docLanguages;
  })
  .then((docLanguages) => {
    const template = _template || { properties: [] };
    const toSyncProperties = template.properties
    .filter(p => p.type.match('select|multiselect|date|multidate|multidaterange|nested|relationship|geolocation|numeric'))
    .map(p => p.name);
    const currentDoc = docLanguages.find(d => d._id.toString() === entity._id.toString());
    const docs = docLanguages.map((d) => {
      if (d._id.toString() === entity._id.toString()) {
        return entity;
      }
      if (!d.metadata) {
        d.metadata = entity.metadata;
      }

      if (entity.metadata) {
        toSyncProperties.forEach((p) => {
          d.metadata[p] = entity.metadata[p];
        });
      }

      if (typeof entity.published !== 'undefined') {
        d.published = entity.published;
      }

      if (entity.toc && currentDoc.file && d.file.filename === currentDoc.file.filename) {
        d.toc = entity.toc;
      }

      if (typeof entity.template !== 'undefined') {
        d.template = entity.template;
      }
      return d;
    });

    return Promise.all(docs.map(d => model.save(d)));
  });
}

function createEntity(doc, languages, sharedId) {
  const docs = languages.map((lang) => {
    const langDoc = Object.assign({}, doc);
    if (!lang.default) {
      delete langDoc._id;
    }

    langDoc.language = lang.key;
    langDoc.sharedId = sharedId;


    return langDoc;
  });

  return model.save(docs);
}

function getEntityTemplate(doc, language) {
  return new Promise((resolve) => {
    if (!doc.sharedId && !doc.template) {
      return resolve(null);
    }

    if (doc.template) {
      return templates.getById(doc.template).then(resolve);
    }

    return this.getById(doc.sharedId, language)
    .then((storedDoc) => {
      if (!storedDoc) {
        return null;
      }
      return templates.getById(storedDoc.template).then(resolve);
    });
  });
}

const unique = (elem, pos, arr) => arr.indexOf(elem) === pos;

function sanitize(doc, template) {
  let undefinedValue;
  if (!template) {
    return Object.assign(doc, { metadata: undefinedValue });
  }

  if (!doc.metadata) {
    return doc;
  }

  const metadata = template.properties.reduce((sanitizedMetadata, { type, name }) => {
    if ((type === 'multiselect' || type === 'relationship') && Array.isArray(sanitizedMetadata[name])) {
      return Object.assign(sanitizedMetadata, { [name]: sanitizedMetadata[name].filter(unique) });
    }

    if (type === 'multidate' && sanitizedMetadata[name]) {
      return Object.assign(sanitizedMetadata, { [name]: sanitizedMetadata[name].filter(value => value) });
    }

    if (type === 'multidaterange' && sanitizedMetadata[name]) {
      return Object.assign(sanitizedMetadata, { [name]: sanitizedMetadata[name].filter(value => value.from || value.to) });
    }

    if (type === 'select' && !sanitizedMetadata[name]) {
      return Object.assign(sanitizedMetadata, { [name]: undefinedValue });
    }

    if (type === 'daterange' && sanitizedMetadata[name]) {
      const value = sanitizedMetadata[name];
      if (!value.to && !value.from) {
        const { [name]: dateRange, ...withoutDateRange } = sanitizedMetadata;
        return withoutDateRange;
      }
    }

    return sanitizedMetadata;
  }, doc.metadata);

  return Object.assign(doc, { metadata });
}

export default {
  sanitize,
  updateEntity,
  createEntity,
  getEntityTemplate,
  save(_doc, { user, language }, updateRelationships = true, index = true) {
    const doc = _doc;
    if (!doc.sharedId) {
      doc.user = user._id;
      doc.creationDate = date.currentUTC();
      doc.published = false;
    }

    const sharedId = doc.sharedId || ID();
    return Promise.all([
      settings.get(),
      this.getEntityTemplate(doc, language),
      templates.get({ default: true }),
    ])
    .then(([{ languages }, template, [defaultTemplate]]) => {
      let docTemplate = template;
      if (doc.sharedId) {
        return this.updateEntity(this.sanitize(doc, template), template);
      }

      if (!doc.template) {
        doc.template = defaultTemplate._id;
        doc.metadata = {};
        docTemplate = defaultTemplate;
      }

      return this.createEntity(this.sanitize(doc, docTemplate), languages, sharedId);
    })
    .then(() => this.getWithRelationships({ sharedId, language }))
    .then(([entity]) => {
      if (updateRelationships) {
        return Promise.all([entity, relationships.saveEntityBasedReferences(entity, language)]);
      }

      return [entity];
    })
    .then(([entity]) => index ? this.indexEntities({ sharedId }, '+fullText').then(() => entity) : entity);
  },

  bulkProcessMetadataFromRelationships(query, language, limit = 200) {
    const process = (offset, totalRows) => {
      if (offset >= totalRows) {
        return Promise.resolve();
      }

      return this.get(query, 'sharedId', { skip: offset, limit })
      .then(entities => this.updateMetdataFromRelationships(entities.map(entity => entity.sharedId), language))
      .then(() => process(offset + limit, totalRows));
    };
    return this.count(query)
    .then(totalRows => process(0, totalRows));
  },

  indexEntities(query, select, limit = 200, batchCallback = () => {}) {
    const index = (offset, totalRows) => {
      if (offset >= totalRows) {
        return Promise.resolve();
      }

      return this.get(query, select, { skip: offset, limit })
      .then(entities => Promise.all(entities.map(entity => relationships.get({ entity: entity.sharedId })
      .then((relations) => {
        entity.relationships = relations || [];
        return entity;
      }))))
      .then(entities => search.bulkIndex(entities).then(() => batchCallback(entities.length, totalRows)))
      .then(() => index(offset + limit, totalRows));
    };
    return this.count(query)
    .then(totalRows => index(0, totalRows));
  },

  async get(query, select, pagination) {
    const entities = await model.get(query, select, pagination);
    return entities;
  },

  async getWithRelationships(query, select, pagination) {
    const _entities = await model.get(query, select, pagination)
    .then(entities => Promise.all(entities.map(entity => relationships.getByDocument(entity.sharedId, entity.language)
    .then((relations) => {
      entity.relationships = relations;
      return entity;
    }))));
    return _entities;
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

  saveMultiple(docs) {
    return model.save(docs)
    .then(response => Promise.all(response, this.indexEntities({ _id: { $in: response.map(d => d._id) } }, '+fullText')))
    .then(response => response);
  },

  multipleUpdate(ids, values, params) {
    return ids.reduce((previousPromise, id) => previousPromise.then(() => this.getById(id, params.language))
    .then((entity) => {
      entity.metadata = Object.assign({}, entity.metadata, values.metadata);
      if (values.icon) {
        entity.icon = values.icon;
      }
      if (values.template) {
        entity.template = values.template;
      }
      if (values.published !== undefined) {
        entity.published = values.published;
      }
      return this.save(entity, params, true, false);
    }), Promise.resolve())
    .then(() => this.indexEntities({ sharedId: { $in: ids } }))
    .then(() => ids);
  },

  getAllLanguages(sharedId) {
    return model.get({ sharedId });
  },

  countByTemplate(template) {
    return model.count({ template });
  },

  getByTemplate(template, language, onlyPublished = true) {
    const query = Object.assign({ template, language }, onlyPublished ? { published: true } : {});
    return model.get(query, ['title', 'icon', 'file', 'sharedId']);
  },

  updateMetdataFromRelationships(entities, language) {
    const entitiesToReindex = [];
    return templates.get()
    .then(_templates => Promise.all(
      entities.map(entityId => Promise.all([this.getById(entityId, language), relationships.getByDocument(entityId, language)])
      .then(([entity, relations]) => {
        if (entity) {
          entity.metadata = entity.metadata || {};
          const template = _templates.find(t => t._id.toString() === entity.template.toString());
          const relationshipProperties = template.properties.filter(p => p.type === 'relationship');
          relationshipProperties.forEach((property) => {
            const relationshipsGoingToThisProperty = relations.filter(r => r.template && r.template.toString() === property.relationType &&
                (!property.content || r.entityData.template.toString() === property.content));
            entity.metadata[property.name] = relationshipsGoingToThisProperty.map(r => r.entity); //eslint-disable-line
          });
          if (relationshipProperties.length) {
            entitiesToReindex.push(entity.sharedId);
            return this.updateEntity(this.sanitize(entity, template), template);
          }
        }
        return Promise.resolve(entity);
      }))))
    .then(() => this.indexEntities({ sharedId: { $in: entitiesToReindex } }));
  },

  updateMetadataProperties(template, currentTemplate, language) {
    const actions = { $rename: {}, $unset: {} };
    template.properties = generateNamesAndIds(template.properties); //eslint-disable-line
    template.properties.forEach((property) => {
      const currentProperty = currentTemplate.properties.find(p => p.id === property.id);
      if (currentProperty && currentProperty.name !== property.name) {
        actions.$rename[`metadata.${currentProperty.name}`] = `metadata.${property.name}`;
      }
    });
    currentTemplate.properties.forEach((property) => {
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

    let dbUpdate = Promise.resolve();
    if (actions.$unset || actions.$rename) {
      dbUpdate = model.db.updateMany({ template }, actions);
    }

    return dbUpdate
    .then(() => {
      if (!template.properties.find(p => p.type === 'relationship')) {
        return this.indexEntities({ template: template._id }, null, 1000);
      }

      return this.bulkProcessMetadataFromRelationships({ template: template._id, language }, language);
    });
  },

  deleteFiles(deletedDocs) {
    let filesToDelete = deletedDocs
    .reduce((filePaths, doc) => {
      if (doc.file) {
        filePaths.push(path.normalize(`${paths.uploadedDocuments}/${doc.file.filename}`));
        filePaths.push(path.normalize(`${paths.uploadedDocuments}/${doc._id.toString()}.jpg`));
      }

      if (doc.attachments) {
        doc.attachments.forEach(file => filePaths.push(path.normalize(`${paths.uploadedDocuments}/${file.filename}`)));
      }

      return filePaths;
    }, []);
    filesToDelete = filesToDelete.filter((doc, index) => filesToDelete.indexOf(doc) === index);
    return deleteFiles(filesToDelete)
    .catch((error) => {
      const fileNotExist = -2;
      if (error.errno === fileNotExist) {
        return Promise.resolve();
      }

      return Promise.reject(error);
    });
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

    return this.count({ sharedId: { $in: sharedIds } })
    .then(totalRows => deleteIndexBatch(0, totalRows));
  },

  deleteMultiple(sharedIds) {
    return this.deleteIndexes(sharedIds)
    .then(() => sharedIds.reduce((previousPromise, sharedId) => previousPromise.then(() => this.delete(sharedId, false)), Promise.resolve()));
  },

  delete(sharedId, deleteIndex = true) {
    return this.get({ sharedId })
    .then(docs => deleteIndex ? Promise.all(docs.map(doc => search.delete(doc))).then(() => docs) : Promise.resolve(docs))
    .then(docs => model.delete({ sharedId })
    .then(() => docs)
    .catch(e => this.indexEntities({ sharedId }, '+fullText').then(() => Promise.reject(e))))
    .then(docs => Promise.all([
      relationships.delete({ entity: sharedId }, null, false),
      this.deleteFiles(docs),
      this.deleteEntityFromMetadata(docs[0].sharedId, docs[0].template)
    ])
    .then(() => docs));
  },

  async getRawPage(sharedId, language, pageNumber) {
    const [entity] = await model.get({ sharedId, language }, { [`fullText.${pageNumber}`]: true });
    if (!entity || !entity.fullText) {
      throw createError('entity does not exists', 404);
    }

    if (typeof entity.fullText[pageNumber] === 'undefined') {
      throw createError('page does not exist', 404);
    }

    const pageNumberMatch = /\[\[(\d+)\]\]/g;
    return entity.fullText[pageNumber].replace(pageNumberMatch, '');
  },

  removeValuesFromEntities(properties, template) {
    const query = { template, $or: [] };
    const changes = {};

    Object.keys(properties).forEach((prop) => {
      const propQuery = {};
      propQuery[`metadata.${prop}`] = { $exists: true };
      query.$or.push(propQuery);
      changes[`metadata.${prop}`] = properties[prop];
    });

    return Promise.all([
      this.get(query, { _id: 1 }),
      model.db.updateMany(query, { $set: changes })
    ])
    .then(([entitiesToReindex]) => this.indexEntities({ _id: { $in: entitiesToReindex.map(e => e._id.toString()) } }));
  },

  async deleteEntityFromMetadata(sharedId, propertyContent) {
    const allTemplates = await templates.get({ 'properties.content': propertyContent });
    const allProperties = allTemplates.reduce((m, t) => m.concat(t.properties), []);
    const selectProperties = allProperties.filter(p => p.type === 'select');
    const multiselectProperties = allProperties.filter(p => p.type === 'multiselect');
    const selectQuery = { $or: [] };
    const selectChanges = {};
    selectQuery.$or = selectProperties.filter(p => propertyContent && p.content && propertyContent.toString() === p.content.toString())
      .map((property) => {
        const p = {};
        p[`metadata.${property.name}`] = sharedId;
        selectChanges[`metadata.${property.name}`] = '';
        return p;
      });
    const multiSelectQuery = { $or: [] };
    const multiSelectChanges = {};
    multiSelectQuery.$or = multiselectProperties.filter(p_1 => propertyContent && p_1.content && propertyContent.toString() === p_1.content.toString())
      .map((property) => {
        const p_2 = {};
        p_2[`metadata.${property.name}`] = sharedId;
        multiSelectChanges[`metadata.${property.name}`] = sharedId;
        return p_2;
      });
    if (!selectQuery.$or.length && !multiSelectQuery.$or.length) {
      return Promise.resolve();
    }
    const [entitiesWithSelect, entitiesWithMultiSelect] = await Promise.all([
      selectQuery.$or.length ? this.get(selectQuery, { _id: 1 }) : [],
      multiSelectQuery.$or.length ? this.get(multiSelectQuery, { _id: 1 }) : []]);
    await Promise.all([
      selectQuery.$or.length ? model.db.updateMany(selectQuery, { $set: selectChanges }) : null,
      multiSelectQuery.$or.length ? model.db.updateMany(multiSelectQuery, { $pull: multiSelectChanges }) : null
    ]);
    const entitiesToReindex = entitiesWithSelect.concat(entitiesWithMultiSelect);
    return this.indexEntities({ _id: { $in: entitiesToReindex.map(e => e._id.toString()) } }, null, 1000);
  },

  async createThumbnail(entity) {
    const filePath = path.join(paths.uploadedDocuments, entity.file.filename);
    return new PDF({ filename: filePath }).createThumbnail(entity._id.toString());
  },

  async deleteLanguageFiles(entity) {
    const filesToDelete = [];
    filesToDelete.push(path.normalize(`${paths.uploadedDocuments}/${entity._id.toString()}.jpg`));
    const sibilings = await this.get({ sharedId: entity.sharedId, _id: { $ne: entity._id } });
    if (entity.file) {
      const shouldUnlinkFile = sibilings.reduce((should, sibiling) => should && !(sibiling.file.filename === entity.file.filename), true);
      if (shouldUnlinkFile) {
        filesToDelete.push(path.normalize(`${paths.uploadedDocuments}/${entity.file.filename}`));
      }
    }
    if (entity.file) { return deleteFiles(filesToDelete); }
  },

  generateNewEntitiesForLanguage(entities, language) {
    return entities.map((_entity) => {
      const entity = Object.assign({}, _entity);
      delete entity._id;
      delete entity.__v;
      entity.language = language;
      return entity;
    });
  },

  async addLanguage(language, limit = 100) {
    const [lanuageTranslationAlreadyExists] = await this.get({ locale: language }, null, { limit: 1 });
    if (lanuageTranslationAlreadyExists) {
      return Promise.resolve();
    }

    const { languages } = await settings.get();

    const defaultLanguage = languages.find(l => l.default).key;
    const duplicate = (offset, totalRows) => {
      if (offset >= totalRows) {
        return Promise.resolve();
      }

      return this.get({ language: defaultLanguage }, '+fullText', { skip: offset, limit })
      .then((entities) => {
        const newLanguageEntities = this.generateNewEntitiesForLanguage(entities, language);
        return this.saveMultiple(newLanguageEntities);
      })
      .then(async (newEntities) => {
        await newEntities.reduce(async (previous, entity) => {
          await previous;
          if (entity.file) {
            return this.createThumbnail(entity);
          }
          return Promise.resolve();
        }, Promise.resolve());
        return duplicate(offset + limit, totalRows);
      });
    };

    return this.count({ language: defaultLanguage })
    .then(totalRows => duplicate(0, totalRows));
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

  count: model.count
};
