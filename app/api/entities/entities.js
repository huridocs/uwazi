import {generateNamesAndIds} from 'api/templates/utils';
import date from 'api/utils/date.js';
import search from 'api/search/search';
import settings from '../settings';
import references from '../references/references';
import templates from '../templates';
import ID from 'shared/uniqueID';
import {deleteFiles} from '../utils/files.js';
import {createError} from 'api/utils';

import model from './entitiesModel';

function updateEntity(doc) {
  return Promise.all([
    this.getAllLanguages(doc.sharedId),
    templates.getById(doc.template)
  ])
  .then(([docLanguages, templateResult]) => {
    if (docLanguages[0].template && doc.template && docLanguages[0].template.toString() !== doc.template.toString()) {
      return Promise.all([
        this.deleteEntityFromMetadata(docLanguages[0]),
        references.delete({sourceType: 'metadata', $or: [{targetDocument: doc.sharedId}, {sourceDocument: doc.sharedId}]})
      ])
      .then(() => [docLanguages, templateResult]);
    }
    return [docLanguages, templateResult];
  })
  .then(([docLanguages, templateResult]) => {
    const template = templateResult || {properties: []};
    const toSyncProperties = template.properties
    .filter(p => p.type.match('select|multiselect|date|multidate|multidaterange|nested'))
    .map(p => p.name);
    const docs = docLanguages.map((d) => {
      if (d._id.equals(doc._id)) {
        return doc;
      }
      if (!d.metadata) {
        d.metadata = doc.metadata;
      }
      toSyncProperties.forEach((p) => {
        d.metadata[p] = doc.metadata[p];
      });

      if (typeof doc.published !== 'undefined') {
        d.published = doc.published;
      }

      if (doc.toc && doc.file && d.file.filename === doc.file.filename) {
        d.toc = doc.toc;
      }

      if (typeof doc.template !== 'undefined') {
        d.template = doc.template;
      }
      return d;
    });

    return Promise.all(docs.map(d => {
      return model.save(d)
      .then((_d) => {
        return search.index(_d);
      });
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

  return model.save(docs).then((savedDocs) => Promise.all(savedDocs.map((d) => search.index(d))));
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
      return templates.getById(storedDoc.template).then(resolve);
    });
  });
}

function sanitize(doc, template) {
  return template.properties.reduce((sanitizedDoc, property) => {
    if (property.type === 'multidate' && sanitizedDoc.metadata && sanitizedDoc.metadata[property.name]) {
      sanitizedDoc.metadata[property.name] = sanitizedDoc.metadata[property.name].filter((value) => value);
    }
    if (property.type === 'multidaterange' && sanitizedDoc.metadata && sanitizedDoc.metadata[property.name]) {
      sanitizedDoc.metadata[property.name] = sanitizedDoc.metadata[property.name].filter((value) => value.from || value.to);
    }
    if (property.type === 'daterange' && sanitizedDoc.metadata && sanitizedDoc.metadata[property.name]) {
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
  save(doc, {user, language}) {
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
      if (!template) {
        return Promise.reject(createError('An entity should have a template properly configured', 400));
      }

      if (doc.sharedId) {
        return this.updateEntity(this.sanitize(doc, template));
      }

      return this.createEntity(this.sanitize(doc, template), languages, sharedId);
    })
    .then(() => this.getById(sharedId, language))
    .then(response => {
      return Promise.all([response, references.saveEntityBasedReferences(response, language)]);
    })
    .then(([entity]) => {
      return entity;
    });
  },

  get(query, select, pagination) {
    return model.get(query, select, pagination);
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
      return Promise.all(response, search.indexEntities({_id: {$in: response.map(d => d._id)}}, '+fullText'));
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

  getByTemplate(template, language) {
    return model.get({template, language});
  },

  updateMetadataProperties(template) {
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

      if (noneToRename && noneToUnset) {
        return Promise.resolve();
      }

      return model.db.updateMany({template}, actions)
      .then(() => search.indexEntities({template: template._id}, null, 1000));
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
      return Promise.all([
        model.delete({sharedId}),
        references.delete({$or: [{targetDocument: sharedId}, {sourceDocument: sharedId}]}),
        this.deleteFiles(docs),
        this.deleteEntityFromMetadata(docs[0])
      ])
      .then(() => docs);
    })
    .then((docs) => {
      return Promise.all(docs.map((doc) => {
        return search.delete(doc);
      }))
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
      return search.indexEntities({_id: {$in: entitiesToReindex.map(e => e._id.toString())}});
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
        return search.indexEntities({_id: {$in: entitiesToReindex.map(e => e._id.toString())}}, null, 1000);
      });
    });
  },

  count: model.count
};
