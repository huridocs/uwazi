import { fromJS } from 'immutable';
import templatesAPI from 'api/templates';
import settings from 'api/settings';
import relationtypes from 'api/relationtypes';
import { generateNamesAndIds } from '../templates/utils';
import entities from 'api/entities/entities';

import model from './model';
import search from '../search/search';
import { generateID } from 'api/odm';
import { createError } from 'api/utils';

import { filterRelevantRelationships, groupRelationships } from './groupByRelationships';

const normalizeConnectedDocumentData = (relationship, connectedDocument) => {
  relationship.entityData = connectedDocument;
  return relationship;
};

function excludeRefs(template) {
  delete template.refs;
  return template;
}

function getPropertiesToBeConnections(template) {
  return template.properties.filter(prop => prop.type === 'relationship');
}

function groupByHubs(references) {
  const hubs = references.reduce((_hubs, reference) => {
    if (!_hubs[reference.hub]) {
      _hubs[reference.hub] = [];
    }
    _hubs[reference.hub].push(reference);
    return _hubs;
  }, []);
  return Object.keys(hubs).map(key => hubs[key]);
}

function findPropertyHub(propertyRelationType, hubs, entitySharedId) {
  return hubs.reduce((result, hub) => {
    const allReferencesAreOfTheType = hub.every(
      reference => reference.entity === entitySharedId ||
      (reference.template && reference.template.toString() === propertyRelationType)
    );
    if (allReferencesAreOfTheType) {
      return hub;
    }

    return result;
  }, null);
}

// Code mostly copied from react/Relationships/reducer/hubsReducer.js, abstract this QUICKLY!
const conformRelationships = (rows, parentEntitySharedId) => {
  let order = -1;
  const hubsObject = fromJS(rows)
  .reduce((hubs, row) => {
    let hubsImmutable = hubs;
    row.get('connections').forEach((connection) => {
      const hubId = connection.get('hub').toString();
      if (!hubsImmutable.has(hubId)) {
        order += 1;
        hubsImmutable = hubsImmutable.set(hubId, fromJS({ hub: hubId, order, leftRelationship: {}, rightRelationships: {} }));
      }

      if (row.get('sharedId') === parentEntitySharedId) {
        hubsImmutable = hubsImmutable.setIn([hubId, 'leftRelationship'], connection);
      } else {
        const templateId = connection.get('template');
        if (!hubsImmutable.getIn([hubId, 'rightRelationships']).has(templateId)) {
          hubsImmutable = hubsImmutable.setIn([hubId, 'rightRelationships', templateId], fromJS([]));
        }
        const newConnection = connection.set('entity', row.delete('connections'));
        hubsImmutable = hubsImmutable.setIn([hubId, 'rightRelationships', templateId],
                                             hubsImmutable.getIn([hubId, 'rightRelationships', templateId]).push(newConnection));
      }
    });

    return hubsImmutable;
  }, fromJS({}));

  return hubsObject.reduce((hubs, hub) => {
    const rightRelationships = hub.get('rightRelationships').reduce((memo, relationshipsArray, template) => {
      const newMemo = memo.push(fromJS({}).set('template', template).set('relationships', relationshipsArray));
      return newMemo;
    }, fromJS([]));
    return hubs.set(hub.get('order'), hub.set('rightRelationships', rightRelationships));
  }, fromJS([]));
};

const limitRelationshipResults = (results, entitySharedId, hubsLimit) => {
  const hubs = conformRelationships(results.rows, entitySharedId).toJS();
  results.totalHubs = hubs.length;
  results.requestedHubs = Number(hubsLimit);

  if (hubsLimit) {
    const hubsToReturn = hubs.slice(0, hubsLimit).map(h => h.hub.toString());
    results.rows = results.rows.reduce((limitedResults, row) => {
      let rowInHubsToReturn = false;
      row.connections = row.connections.reduce((limitedConnections, connection) => {
        if (hubsToReturn.indexOf(connection.hub.toString()) !== -1) {
          limitedConnections.push(connection);
          rowInHubsToReturn = true;
        }
        return limitedConnections;
      }, []);

      if (rowInHubsToReturn) {
        limitedResults.push(row);
      }

      return limitedResults;
    }, []);
  }

  return results;
};

export default {
  get(query, select, pagination) {
    return model.get(query, select, pagination);
  },

  getById(id) {
    return model.getById(id);
  },

  getDocumentHubs(id, language) {
    return model.get({ entity: id, language })
    .then((ownRelations) => {
      const hubsIds = ownRelations.map(relationship => relationship.hub);
      return model.db.aggregate([
        { $match: { hub: { $in: hubsIds }, language } },
        { $group: {
          _id: '$hub',
          relationships: { $push: '$$ROOT' },
          count: { $sum: 1 }
        } }
      ]);
    })
    .then(hubs => hubs.filter(hub => hub.count > 1));
  },

  getByDocument(id, language, withEntityData = true) {
    return this.getDocumentHubs(id, language)
    .then((hubs) => {
      const relationships = Array.prototype.concat(...hubs.map(hub => hub.relationships));
      const connectedEntityiesSharedId = relationships.map(relationship => relationship.entity);
      return entities.get({ sharedId: { $in: connectedEntityiesSharedId }, language })
      .then((_connectedDocuments) => {
        const connectedDocuments = _connectedDocuments.reduce((res, doc) => {
          res[doc.sharedId] = doc;
          return res;
        }, {});
        return relationships.map((_relationship) => {
          const relationship = Object.assign({}, { template: null }, _relationship);

          if (withEntityData) {
            return normalizeConnectedDocumentData(relationship, connectedDocuments[relationship.entity]);
          }
          return relationship;
        });
      });
    });
  },

  getGroupsByConnection(id, language, options = {}) {
    return Promise.all([
      this.getByDocument(id, language),
      templatesAPI.get(),
      relationtypes.get()
    ])
    .then(([references, templates, relationTypes]) => {
      const relevantReferences = filterRelevantRelationships(references, id, language, options.user);
      const groupedReferences = groupRelationships(relevantReferences, templates, relationTypes);

      if (options.excludeRefs) {
        groupedReferences.forEach((g) => {
          g.templates = g.templates.map(excludeRefs);
        });
      }
      return groupedReferences;
    });
  },

  getHub(hub, language) {
    return model.get({ hub, language });
  },

  countByRelationType(typeId) {
    return model.count({ template: typeId });
  },

  getAllLanguages(sharedId) {
    return model.get({ sharedId });
  },

  updateRelationship(relationship) {
    const getTemplate = relationship.template && relationship.template._id === null ? null : relationtypes.getById(relationship.template);
    return Promise.all([getTemplate, model.get({ sharedId: relationship.sharedId })])
    .then(([template, relationshipsVersions]) => {
      let toSyncProperties = [];
      if (template && template.properties) {
        toSyncProperties = template.properties
        .filter(p => p.type.match('select|multiselect|date|multidate|multidaterange|nested'))
        .map(p => p.name);
      }

      relationship.metadata = relationship.metadata || {};
      const updateRelationships = relationshipsVersions.map((relation) => {
        if (relationship._id.toString() === relation._id.toString()) {
          if (relationship.template && relationship.template._id === null) {
            relationship.template = null;
          }
          return model.save(relationship);
        }
        toSyncProperties.map((propertyName) => {
          relation.metadata = relation.metadata || {};
          relation.metadata[propertyName] = relationship.metadata[propertyName];
        });
        return model.save(relation);
      });
      return Promise.all(updateRelationships).then(relations => relations.find(r => r.language === relationship.language));
    });
  },

  createRelationship(relationship) {
    relationship.sharedId = generateID();
    return entities.get({ sharedId: relationship.entity })
    .then((entitiesVersions) => {
      const currentLanguageEntity = entitiesVersions.find(entity => entity.language === relationship.language);
      currentLanguageEntity.file = currentLanguageEntity.file || {};
      const relationshipsCreation = entitiesVersions.map((entity) => {
        const isATextReference = relationship.range;
        entity.file = entity.file || {};
        const entityFileDoesNotMatch = currentLanguageEntity.file.filename !== entity.file.filename;
        if (isATextReference && entityFileDoesNotMatch) {
          return Promise.resolve();
        }
        const _relationship = Object.assign({}, relationship);
        _relationship.language = entity.language;
        return model.save(_relationship);
      });
      return Promise.all(relationshipsCreation).then(relations => relations.filter(r => r).find(r => r.language === relationship.language));
    });
  },

  bulk(bulkData, language) {
    const saveActions = bulkData.save.map(reference => this.save(reference, language), false);
    const deleteActions = bulkData.delete.map(reference => this.delete(reference, language), false);
    const unique = (elem, pos, arr) => arr.indexOf(elem) === pos;

    const hubsAffectedBySave = bulkData.save.map((item) => {
      if (Array.isArray(item)) {
        return item[0].hub;
      }
      return item.hub;
    }).filter(unique);

    const hubsAffectedByDelete = bulkData.delete.map(item => item.hub).filter(unique);
    const hubsAffected = hubsAffectedBySave.concat(hubsAffectedByDelete).filter(unique);
    const entitiesAffectedByDelete = bulkData.delete.map(item => item.entity).filter(unique);

    return Promise.all(saveActions.concat(deleteActions))
    .then(bulkResponse => Promise.all(hubsAffected.map(hubid => this.getHub(hubid, language)))
    .then((hubs) => {
      const entitiesAffected = hubs.reduce((result, hub) => result.concat(hub.map(relationship => relationship.entity)), [])
      .concat(entitiesAffectedByDelete).filter(unique);

      return entities.updateMetdataFromRelationships(entitiesAffected, language)
      .then(() => bulkResponse);
    }));
  },

  save(_relationships, language, updateMetdata = true) {
    if (!language) {
      return Promise.reject(createError('Language cant be undefined'));
    }
    let relationships = _relationships;
    if (!Array.isArray(relationships)) {
      relationships = [relationships];
    }

    if (relationships.length === 1 && !relationships[0].hub) {
      return Promise.reject(createError('Single relationships must have a hub'));
    }
    const hub = relationships[0].hub || generateID();
    return Promise.all(
      relationships.map((relationship) => {
        let action;
        relationship.hub = hub;
        relationship.language = language;
        if (relationship.sharedId) {
          action = this.updateRelationship(relationship);
        } else {
          action = this.createRelationship(relationship);
        }

        return action
        .then(savedRelationship => Promise.all([savedRelationship, entities.getById(savedRelationship.entity, language)]))
        .then(([result, connectedEntity]) => {
          if (updateMetdata) {
            return this.updateEntitiesMetadataByHub(hub, language)
            .then(() => normalizeConnectedDocumentData(result, connectedEntity));
          }
          return normalizeConnectedDocumentData(result, connectedEntity);
        });
      })
    );
  },

  updateEntitiesMetadataByHub(hubId, language) {
    return this.getHub(hubId, language)
    .then(hub => entities.updateMetdataFromRelationships(hub.map(r => r.entity), language));
  },

  updateEntitiesMetadata(entitiesIds, language) {
    return entities.updateMetdataFromRelationships(entitiesIds, language);
  },

  saveEntityBasedReferences(entity, language) {
    if (!language) {
      return Promise.reject(createError('Language cant be undefined'));
    }
    if (!entity.template) {
      return Promise.resolve([]);
    }

    return templatesAPI.getById(entity.template)
    .then(getPropertiesToBeConnections)
    .then(properties => Promise.all([properties, this.getByDocument(entity.sharedId, language)]))
    .then(([properties, references]) => Promise.all(properties.map((property) => {
      let propertyValues = entity.metadata[property.name] || [];
      if (typeof propertyValues === 'string') {
        propertyValues = [propertyValues];
      }
      const hubs = groupByHubs(references);
      const propertyRelationType = property.relationType.toString();
      const entityType = property.content;
      let hub = findPropertyHub(propertyRelationType, hubs, entity.sharedId);
      if (!hub) {
        hub = [{ entity: entity.sharedId, hub: generateID() }];
      }

      const referencesOfThisType = references.filter(reference =>
        reference.template &&
          reference.template.toString() === propertyRelationType.toString()
      );

      propertyValues.forEach((entitySharedId) => {
        const relationshipDoesNotExists = !referencesOfThisType.find(reference => reference.entity === entitySharedId);
        if (relationshipDoesNotExists) {
          hub.push({ entity: entitySharedId, hub: hub[0].hub, template: propertyRelationType });
        }
      });
      const referencesToBeDeleted = references.filter(reference => !(reference.entity === entity.sharedId) &&
          reference.template && reference.template.toString() === propertyRelationType &&
          (!entityType || reference.entityData.template.toString() === entityType) &&
          !propertyValues.includes(reference.entity));

      let save = Promise.resolve();
      if (hub.length > 1) {
        save = this.save(hub, language, false);
      }

      return save.then(() => Promise.all(referencesToBeDeleted.map(reference => this.delete({ _id: reference._id }, language, false))));
    })));
  },

  search(entitySharedId, query, language, user) {
    const hubsLimit = query.limit || 0;

    if (!language) {
      return Promise.reject(createError('Language cant be undefined'));
    }
    return Promise.all([this.getByDocument(entitySharedId, language), entities.getById(entitySharedId, language)])
    .then(([relationships, entity]) => {
      relationships.sort((a, b) => (a.entity + a.hub.toString()).localeCompare(b.entity + b.hub.toString()));

      const filter = Object.keys(query.filter).reduce((result, filterGroupKey) => result.concat(query.filter[filterGroupKey]), []);
      const filteredRelationships = relationships.filter(relationship =>
        !filter.length ||
        filter.includes(relationship.template + relationship.entityData.template)
      );

      const ids = filteredRelationships
      .map(relationship => relationship.entity)
      .reduce((result, id) => {
        if (!result.includes(id) && id !== entitySharedId) {
          result.push(id);
        }
        return result;
      }, []);
      query.ids = ids.length ? ids : ['no_results'];
      query.includeUnpublished = true;
      query.limit = 9999;
      delete query.filter;

      return search.search(query, language, user)
      .then((results) => {
        results.rows.forEach((item) => {
          item.connections = filteredRelationships.filter(relationship => relationship.entity === item.sharedId);
        });

        if (results.rows.length) {
          let filteredRelationshipsHubs = results.rows.map(item => item.connections.map(relationship => relationship.hub.toString()));
          filteredRelationshipsHubs = Array.prototype.concat(...filteredRelationshipsHubs);
          entity.connections = relationships.filter(relationship =>
            relationship.entity === entitySharedId &&
            filteredRelationshipsHubs.includes(relationship.hub.toString())
          );
          results.rows.push(entity);
        }


        return limitRelationshipResults(results, entitySharedId, hubsLimit);
      });
    });
  },

  delete(relationQuery, language, updateMetdata = true) {
    if (!relationQuery) {
      return Promise.reject(createError('Cant delete without a condition'));
    }

    let languages;
    let relation;

    return Promise.all([settings.get(), model.get(relationQuery)])
    .then(([_settings, relationships]) => {
      ({ languages } = _settings);
      [relation] = relationships;
      return relationships;
    })
    .then(relationships => Promise.all(relationships.map(_relation => model.get({ hub: _relation.hub }))))
    .then(hubRelationships => Promise.all(hubRelationships.map((hub) => {
      const shouldDeleteHub = languages.reduce((shouldDelete, currentLanguage) =>
        hub.filter(r => r.language === currentLanguage.key).length <= 2 && shouldDelete, true
      );

      const hubId = hub[0].hub;
      let deleteAction;

      if (shouldDeleteHub) {
        deleteAction = model.delete({ hub: hubId });
      } else {
        let deleteQuery = relationQuery;
        if (relationQuery._id) {
          deleteQuery = { sharedId: relation.sharedId.toString() };
        }
        deleteAction = model.delete(deleteQuery);
      }

      if (updateMetdata) {
        return deleteAction.then(() => Promise.all(languages.map(l => this.updateEntitiesMetadata(hub.map(r => r.entity), l.key))));
      }

      return deleteAction;
    })))
    .catch(console.log);
  },

  deleteTextReferences(sharedId, language) {
    return model.delete({ entity: sharedId, language, range: { $exists: true } });
  },

  updateMetadataProperties(template, currentTemplate) {
    const actions = {};
    actions.$rename = {};
    actions.$unset = {};
    template.properties = generateNamesAndIds(template.properties);
    template.properties.forEach((property) => {
      const currentProperty = currentTemplate.properties.find(p => p.id === property.id);
      if (currentProperty && currentProperty.name !== property.name) {
        actions.$rename[`metadata.${currentProperty.name}`] = `metadata.${property.name}`;
      }
    });
    currentTemplate.properties = currentTemplate.properties || [];
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

    if (noneToRename && noneToUnset) {
      return Promise.resolve();
    }

    return model.db.updateMany({ template }, actions);
  },

  count: model.count
};
