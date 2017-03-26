import {generateNamesAndIds} from 'api/templates/utils';
import date from 'api/utils/date.js';
import search from 'api/search/search';
import settings from '../settings';
import references from '../references/references';
import templates from '../templates';
import ID from 'shared/uniqueID';
import {deleteFiles} from '../utils/files.js';

import model from './entitiesModel';

export default {
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
    return settings.get()
    .then(({languages}) => {
      if (doc.sharedId) {
        return Promise.all([
          this.getAllLanguages(doc.sharedId),
          templates.getById(doc.template)
        ])
        .then(([docLanguages, templateResult]) => {
          if (docLanguages[0].template && doc.template && docLanguages[0].template.toString() !== doc.template.toString()) {
            return this.deleteEntityFromMetadata(docLanguages[0]).then(() => [docLanguages, templateResult]);
          }
          return [docLanguages, templateResult];
        })
        .then(([docLanguages, templateResult]) => {
          const template = templateResult || {properties: []};
          const toSyncProperties = template.properties.filter(p => p.type.match('select|multiselect|date|multidate|multidaterange')).map(p => p.name);
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

      const docs = languages.map((lang) => {
        let langDoc = Object.assign({}, doc);
        langDoc.language = lang.key;
        langDoc.sharedId = sharedId;
        return langDoc;
      });

      return model.save(docs).then((savedDocs) => Promise.all(savedDocs.map((d) => search.index(d))));
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
      Promise.all(docs.map((d) => search.index(d)));
      return response;
    });
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
        let currentName = currentTemplate.properties.find(p => p.id === property.id).name;
        if (currentName !== property.name) {
          actions.$rename['metadata.' + currentName] = 'metadata.' + property.name;
        }
      });
      currentTemplate.properties.forEach((property) => {
        if (!template.properties.find(p => p.id === property.id)) {
          actions.$unset['metadata.' + property.name] = '';
        }
      });

      if (!Object.keys(actions.$unset).length) {
        delete actions.$unset;
        if (!Object.keys(actions.$rename).length) {
          return Promise.resolve();
        }
      }

      return model.db.updateMany({template}, actions)
      .then(() => search.indexEntities({template: template._id}, {metadata: 1}));
    });
  },

  deleteFiles(deletedDocs) {
    let filesToDelete = deletedDocs
    .filter(d => d.file)
    .map((doc) => {
      return `./uploaded_documents/${doc.file.filename}`;
    });
    filesToDelete = filesToDelete.filter((doc, index) => filesToDelete.indexOf(doc) === index);
    return deleteFiles(filesToDelete);
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
        model.db.updateMany(selectQuery, {$set: selectChanges}),
        model.db.updateMany(multiSelectQuery, {$pull: multiSelectChanges})
      ])
      .then(() => {
        return search.indexEntities({template: {$in: allTemplates.map(t => t._id.toString())}}, {metadata: 1});
      });
    });
  },

  count: model.count
};
