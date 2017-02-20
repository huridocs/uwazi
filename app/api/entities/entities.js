//import {updateMetadataNames, deleteMetadataProperties} from 'api/entities/utils';
import date from 'api/utils/date.js';
import search from 'api/search/search';
import settings from '../settings';
import references from '../references/references';
import templates from '../templates';
import ID from 'shared/uniqueID';

import model from './entitiesModel';

export default {
  save(doc, {user, language}) {
    if (!doc.sharedId) {
      doc.user = user;
      doc.creationDate = date.currentUTC();
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
            d.published = doc.published;
            d.template = doc.template;
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

      return model.save(docs).then(() => Promise.all(docs.map((d) => search.index(d))));
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

  getAllLanguages(sharedId) {
    return model.get({sharedId});
  },

  countByTemplate(template) {
    return model.count({template});
  },

  getByTemplate(template, language) {
    return model.get({template, language});
  },

  //updateMetadataProperties(templateId, nameMatches, deleteProperties) {
    //return request.get(`${dbURL}/_design/entities/_view/metadata_by_template?key="${templateId}"`)
    //.then((response) => {
      //let entities = response.json.rows.map((r) => r.value);
      //entities = updateMetadataNames(entities, nameMatches);
      //entities = deleteMetadataProperties(entities, deleteProperties);

      //let updates = [];
      //entities.forEach((entity) => {
        //let url = `${dbURL}/_design/entities/_update/partialUpdate/${entity._id}`;
        //updates.push(request.post(url, entity));
      //});

      //return Promise.all(updates);
    //});
  //},

  delete(sharedId) {
    return this.get({sharedId})
    .then((docs) => {
      return Promise.all([
        model.delete({sharedId}),
        references.delete({$or: [{targetDocument: sharedId}, {sourceDocument: sharedId}]})
      ])
      .then(() => docs);
    })
    .then((docs) => {
      return Promise.all(docs.map((doc) => {
        return search.delete(doc);
      }))
      .then(() => docs);
    });
  }
};
