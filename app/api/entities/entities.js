import {generateNamesAndIds} from 'api/templates/utils';
import date from 'api/utils/date.js';
import search from 'api/search/search';
import settings from '../settings';
import relationships from 'api/relationships/relationships';
import templates from 'api/templates/templates';
import ID from 'shared/uniqueID';
import {deleteFiles} from '../utils/files.js';

import model from './entitiesModel';

function updateEntity(entity, _template) {
  this.getAllLanguages(entity.sharedId)
  .then((docLanguages) => {
    if (docLanguages[0].template && entity.template && docLanguages[0].template.toString() !== entity.template.toString()) {
      return Promise.all([
        this.deleteEntityFromMetadata(docLanguages[0]),
        relationships.delete({entity: entity.sharedId}, null, false)
      ])
      .then(() => docLanguages);
    }
    return docLanguages;
  })
  .then((docLanguages) => {
    const template = _template || {properties: []};
    const toSyncProperties = template.properties
    .filter(p => p.type.match('select|multiselect|date|multidate|multidaterange|nested|relationship'))
    .map(p => p.name);
    const currentDoc = docLanguages.find((d) => d._id.toString() === entity._id.toString());
    const docs = docLanguages.map((d) => {
      if (d._id.equals(entity._id)) {
        return entity;
      }
      if (!d.metadata) {
        d.metadata = entity.metadata;
      }
      toSyncProperties.forEach((p) => {
        d.metadata[p] = entity.metadata[p];
      });

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

    return Promise.all(docs.map(d => {
      return model.save(d);
    }));
  });
}

function createEntity(doc, languages, sharedId) {
  const docs = languages.map((lang) => {
    let langDoc = Object.assign({}, doc);
    langDoc.language = lang.key;
    langDoc.sharedId = sharedId;
    return langDoc;
  });

  return model.save(docs);
}

function getEntityTemplate(doc, language) {
  return new Promise((resolve) => {
    if (!doc.sharedId && !doc.template) {
      resolve(null);
    }

    if (doc.template) {
      return templates.getById(doc.template).then(resolve);
    }

    this.getById(doc.sharedId, language)
    .then((storedDoc) => {
      if (!storedDoc) {
        return null;
      }
      return templates.getById(storedDoc.template).then(resolve);
    });
  });
}

function sanitize(doc, template) {
  if (!template) {
    delete doc.metadata;
    return doc;
  }

  if (!doc.metadata) {
    return doc;
  }

  return template.properties.reduce((sanitizedDoc, property) => {
    const type = property.type;
    if ((type === 'multiselect' || type === 'relationship') && Array.isArray(sanitizedDoc.metadata[property.name])) {
      sanitizedDoc.metadata[property.name] = sanitizedDoc.metadata[property.name].filter((elem, pos, arr) => arr.indexOf(elem) === pos);
    }
    if (type === 'relationship' && Array.isArray(sanitizedDoc.metadata[property.name])) {
      sanitizedDoc.metadata[property.name] = sanitizedDoc.metadata[property.name].filter((elem, pos, arr) => arr.indexOf(elem) === pos);
    }
    if (type === 'multidate' && sanitizedDoc.metadata[property.name]) {
      sanitizedDoc.metadata[property.name] = sanitizedDoc.metadata[property.name].filter((value) => value);
    }
    if (type === 'multidaterange' && sanitizedDoc.metadata[property.name]) {
      sanitizedDoc.metadata[property.name] = sanitizedDoc.metadata[property.name].filter((value) => value.from || value.to);
    }
    if (type === 'daterange' && sanitizedDoc.metadata[property.name]) {
      const value = sanitizedDoc.metadata[property.name];
      if (!value.to && !value.from) {
        delete sanitizedDoc.metadata[property.name];
      }
    }
    return sanitizedDoc;
  }, doc);
}

export default {
  sanitize,
  updateEntity,
  createEntity,
  getEntityTemplate,
  save(doc, {user, language}, updateRelationships = true) {
    if (!doc.sharedId) {
      doc.user = user._id;
      doc.creationDate = date.currentUTC();
      doc.published = false;
    }

    if (!doc.type) {
      doc.type = 'entity';
    }

    const sharedId = doc.sharedId || ID();
    return Promise.all([
      settings.get(),
      this.getEntityTemplate(doc, language)
    ])
    .then(([{languages}, template]) => {
      if (doc.sharedId) {
        return this.updateEntity(this.sanitize(doc, template), template);
      }

      return this.createEntity(this.sanitize(doc, template), languages, sharedId);
    })
    .then(() => this.getById(sharedId, language))
    .then(entity => {
      if (updateRelationships) {
        return Promise.all([entity, relationships.saveEntityBasedReferences(entity, language)]);
      }

      return [entity];
    })
    .then(([entity]) => {
      return this.indexEntities({sharedId}, '+fullText').then(() => entity);
    });
  },

  bulkProcessMetadataFromRelationships(query, language, limit = 200) {
    const index = (offset, totalRows) => {
      if (offset >= totalRows) {
        return Promise.resolve();
      }

      return this.get(query, 'sharedId', {skip: offset, limit})
      .then((entities) => this.updateMetdataFromRelationships(entities.map((entity) => entity.sharedId), language))
      .then(() => index(offset + limit, totalRows));
    };
    return this.count(query)
    .then((totalRows) => {
      return index(0, totalRows);
    });
  },

  indexEntities(query, select, limit = 200) {
    const index = (offset, totalRows) => {
      if (offset >= totalRows) {
        return Promise.resolve();
      }

      return this.get(query, select, {skip: offset, limit})
      .then((docs) => search.bulkIndex(docs))
      .then(() => index(offset + limit, totalRows));
    };
    return this.count(query)
    .then((totalRows) => {
      return index(0, totalRows);
    });
  },

  get(query, select, pagination) {
    return model.get(query, select, pagination);
  },

  getWithRelationships(query, select, pagination) {
    return model.get(query, select, pagination)
    .then((entities) => {
      return Promise.all(entities.map((entity) => {
        return relationships.getByDocument(entity.sharedId, entity.language)
        .then((relations) => {
          entity.relationships = relations;
          return entity;
        });
      }));
    });
  },

  getById(sharedId, language) {
    if (!language) {
      return model.getById(sharedId);
    }

    return model.get({sharedId, language}).then((result) => result[0]);
  },

  saveMultiple(docs) {
    return model.save(docs)
    .then((response) => {
      return Promise.all(response, this.indexEntities({_id: {$in: response.map(d => d._id)}}, '+fullText'));
    })
    .then(response => response);
  },

  multipleUpdate(ids, values, params) {
    return Promise.all(ids.map((id) => {
      return this.getById(id, params.language)
      .then((entity) => {
        entity.metadata = Object.assign({}, entity.metadata, values.metadata);
        if (values.icon) {
          entity.icon = values.icon;
        }
        if (values.template) {
          entity.template = values.template;
        }
        return this.save(entity, params);
      });
    }));
  },

  getAllLanguages(sharedId) {
    return model.get({sharedId});
  },

  countByTemplate(template) {
    return model.count({template});
  },

  getByTemplate(template, language, published = true) {
    return model.get({template, language, published});
  },

  updateMetdataFromRelationships(entities, language) {
    const entitiesToReindex = [];
    return templates.get()
    .then((_templates) => {
      return Promise.all(entities.map((entityId) => {
        return Promise.all([this.getById(entityId, language), relationships.getByDocument(entityId, language)])
        .then(([entity, relations]) => {
          const template = _templates.find((t) => t._id.toString() === entity.template.toString());
          const relationshipProperties = template.properties.filter((p) => p.type === 'relationship');
          relationshipProperties.forEach((property) => {
            const relationshipsGoingToThisProperty = relations.filter((r) => {
              return r.template && r.template.toString() === property.relationType &&
              (!property.content || r.entityData.template.toString() === property.content);
            });
            entity.metadata[property.name] = relationshipsGoingToThisProperty.map((r) => r.entity);
          });
          if (relationshipProperties.length) {
            entitiesToReindex.push(entity.sharedId);
            return this.updateEntity(this.sanitize(entity, template), template);
          }
          return Promise.resolve(entity);
        });
      }));
    })
    .then(() => this.indexEntities({sharedId: {$in: entitiesToReindex}}));
  },

  updateMetadataProperties(template, language) {
    let actions = {};
    actions.$rename = {};
    actions.$unset = {};
    return templates.getById(template._id)
    .then((currentTemplate) => {
      template.properties = generateNamesAndIds(template.properties);
      template.properties.forEach((property) => {
        let currentProperty = currentTemplate.properties.find(p => p.id === property.id);
        if (currentProperty && currentProperty.name !== property.name) {
          actions.$rename['metadata.' + currentProperty.name] = 'metadata.' + property.name;
        }
      });
      currentTemplate.properties.forEach((property) => {
        if (!template.properties.find(p => p.id === property.id)) {
          actions.$unset['metadata.' + property.name] = '';
        }
      });

      let noneToUnset = !Object.keys(actions.$unset).length;
      let noneToRename = !Object.keys(actions.$rename).length;

      if (noneToUnset) {
        delete actions.$unset;
      }
      if (noneToRename) {
        delete actions.$rename;
      }

      return model.db.updateMany({template}, actions)
      .then(() => {
        if (!template.properties.find(p => p.type === 'relationship')) {
          return this.indexEntities({template: template._id}, null, 1000);
        }

        return this.bulkProcessMetadataFromRelationships({template: template._id, language}, language);
      });
    });
  },

  deleteFiles(deletedDocs) {
    let filesToDelete = deletedDocs
    .filter(d => d.file)
    .map((doc) => {
      return `./uploaded_documents/${doc.file.filename}`;
    });
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

  deleteMultiple(sharedIds) {
    return Promise.all(sharedIds.map((sharedId) => this.delete(sharedId)));
  },

  delete(sharedId) {
    return this.get({sharedId})
    .then((docs) => {
      return Promise.all(docs.map((doc) => search.delete(doc))).then(() => docs);
    })
    .then((docs) => {
      return model.delete({sharedId})
      .then(() => docs)
      .catch((e) => {
        return this.indexEntities({sharedId}, '+fullText').then(() => Promise.reject(e));
      });
    })
    .then((docs) => {
      return Promise.all([
        relationships.delete({entity: sharedId}, null, false),
        this.deleteFiles(docs),
        this.deleteEntityFromMetadata(docs[0])
      ])
      .then(() => docs);
    });
  },

  removeValuesFromEntities(properties, template) {
    let query = {template, $or: []};
    let changes = {};

    Object.keys(properties).forEach((prop) => {
      let propQuery = {};
      propQuery['metadata.' + prop] = {$exists: true};
      query.$or.push(propQuery);
      changes['metadata.' + prop] = properties[prop];
    });

    return Promise.all([
      this.get(query, {_id: 1}),
      model.db.updateMany(query, {$set: changes})
    ])
    .then(([entitiesToReindex]) => {
      return this.indexEntities({_id: {$in: entitiesToReindex.map(e => e._id.toString())}});
    });
  },

  deleteEntityFromMetadata(entity) {
    return templates.get({'properties.content': entity.template})
    .then((allTemplates) => {
      const allProperties = allTemplates.reduce((m, t) => m.concat(t.properties), []);
      const selectProperties = allProperties.filter(p => p.type === 'select');
      const multiselectProperties = allProperties.filter(p => p.type === 'multiselect');
      let selectQuery = {$or: []};
      let selectChanges = {};
      selectQuery.$or = selectProperties.filter(p => entity.template && p.content && entity.template.toString() === p.content.toString())
      .map((property) => {
        let p = {};
        p[`metadata.${property.name}`] = entity.sharedId;
        selectChanges[`metadata.${property.name}`] = '';
        return p;
      });

      let multiSelectQuery = {$or: []};
      let multiSelectChanges = {};
      multiSelectQuery.$or = multiselectProperties.filter(p => entity.template && p.content && entity.template.toString() === p.content.toString())
      .map((property) => {
        let p = {};
        p[`metadata.${property.name}`] = entity.sharedId;
        multiSelectChanges[`metadata.${property.name}`] = entity.sharedId;
        return p;
      });

      if (!selectQuery.$or.length && !multiSelectQuery.$or.length) {
        return;
      }

      return Promise.all([
        selectQuery.$or.length ? this.get(selectQuery, {_id: 1}) : [],
        multiSelectQuery.$or.length ? this.get(multiSelectQuery, {_id: 1}) : [],
        model.db.updateMany(selectQuery, {$set: selectChanges}),
        model.db.updateMany(multiSelectQuery, {$pull: multiSelectChanges})
      ])
      .then(([entitiesWithSelect, entitiesWithMultiSelect]) => {
        let entitiesToReindex = entitiesWithSelect.concat(entitiesWithMultiSelect);
        return this.indexEntities({_id: {$in: entitiesToReindex.map(e => e._id.toString())}}, null, 1000);
      });
    });
  },

  count: model.count
};
