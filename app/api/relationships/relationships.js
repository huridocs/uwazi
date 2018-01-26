import templatesAPI from 'api/templates';
import relationTypesAPI from 'api/relationtypes/relationtypes';
import {generateNamesAndIds} from '../templates/utils';
import entities from '../entities';

import model from './relationshipsModel.js';
import search from '../search/search';
import {generateID} from 'api/odm';
import {createError} from 'api/utils';

import {filterRelevantRelationships, groupRelationships} from './groupByRelationships';

let normalizeConnection = (relationship) => {
  relationship.range = relationship.range || {text: ''};
  return relationship;
};

let normalizeConnectedDocumentData = (relationship, connectedDocument) => {
  relationship.entityData = connectedDocument;
  return relationship;
};

function excludeRefs(template) {
  delete template.refs;
  return template;
}

function getPropertiesToBeConnections(template) {
  return template.properties.filter((prop) => prop.type === 'relationship');
}

function groupByHubs(references) {
  let hubs = references.reduce((_hubs, reference) => {
    if (!_hubs[reference.hub]) {
      _hubs[reference.hub] = [];
    }
    _hubs[reference.hub].push(reference);
    return _hubs;
  }, []);
  return Object.keys(hubs).map((key) => hubs[key]);
}

function findPropertyHub(propertyRelationType, hubs, entitySharedId) {
  return hubs.reduce((result, hub) => {
    const allReferencesAreOfTheType = hub.every((reference) => {
      return reference.entity === entitySharedId || reference.template.toString() === propertyRelationType;
    });
    if (allReferencesAreOfTheType) {
      return hub;
    }

    return result;
  }, null);
}

export default {
  get(query) {
    return model.get(query);
  },

  getById(id) {
    return model.getById(id);
  },

  getByDocument(id, language) {
    return model.get({entity: id})
    .then((ownRelations) => {
      const hubs = ownRelations.map(relationship => relationship.hub);
      return model.get({hub: {$in: hubs}});
    })
    .then((response) => {
      let relationships = response.map((relationship) => normalizeConnection(relationship, id));
      let connectedEntityiesSharedId = relationships.map((relationship) => relationship.entity);
      return entities.get({sharedId: {$in: connectedEntityiesSharedId}, language})
      .then((_connectedDocuments) => {
        const connectedDocuments = _connectedDocuments.reduce((res, doc) => {
          res[doc.sharedId] = doc;
          return res;
        }, {});
        return relationships.map((relationship) => {
          return normalizeConnectedDocumentData(relationship, connectedDocuments[relationship.entity]);
        });
      });
    });
  },

  getGroupsByConnection(id, language, options = {}) {
    return Promise.all([
      this.getByDocument(id, language),
      templatesAPI.get(),
      relationTypesAPI.get()
    ])
    .then(([references, templates, relationTypes]) => {
      const relevantReferences = filterRelevantRelationships(references, id, language, options.user);
      const groupedReferences = groupRelationships(relevantReferences, templates, relationTypes);

      if (options.excludeRefs) {
        groupedReferences.forEach(g => {
          g.templates = g.templates.map(excludeRefs);
        });
      }
      return groupedReferences;
    });
  },

  getHub(hub) {
    return model.get({hub});
  },

  countByRelationType(typeId) {
    return model.count({template: typeId});
  },

  save(_relationships, language) {
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
        relationship.hub = hub;
        return model.save(relationship)
        .then((r) => {
          return normalizeConnection(r);
        })
        .then((savedConnection) => {
          return Promise.all([savedConnection, entities.getById(savedConnection.entity, language)]);
        })
        .then(([result, connectedEntity]) => {
          return normalizeConnectedDocumentData(result, connectedEntity);
        });
      }));
  },

  saveEntityBasedReferences(entity, language) {
    if (!entity.template) {
      return Promise.resolve([]);
    }

    return templatesAPI.getById(entity.template)
    .then(getPropertiesToBeConnections)
    .then((properties) => {
      return Promise.all([properties, this.getByDocument(entity.sharedId, language)]);
    })
    .then(([properties, references]) => {
      return Promise.all(properties.map((property) => {
        let propertyValues = entity.metadata[property.name] || [];
        if (typeof propertyValues === 'string') {
          propertyValues = [propertyValues];
        }
        let hubs = groupByHubs(references);
        let propertyRelationType = property.relationType;
        let propertyHub = findPropertyHub(propertyRelationType, hubs, entity.sharedId);
        if (!propertyHub) {
          propertyHub = [{entity: entity.sharedId, hub: generateID()}];
        }
        let referencesOfThisType = references.filter((reference) =>
          reference.template &&
          reference.template.toString() === propertyRelationType.toString()
        );
        propertyValues.forEach((entitySharedId) => {
          let relationshipDoesNotExists = !referencesOfThisType.find((reference) => reference.entity === entitySharedId);
          if (relationshipDoesNotExists) {
            propertyHub.push({entity: entitySharedId, hub: propertyHub[0].hub, template: propertyRelationType});
          }
        });

        propertyHub = propertyHub.filter((reference) => reference.entity === entity.sharedId || propertyValues.includes(reference.entity));

        const referencesToBeDeleted = references.filter((reference) => {
          return !(reference.entity === entity.sharedId) &&
          reference.template.toString() === propertyRelationType.toString() &&
          !propertyValues.includes(reference.entity);
        });

        let actions = referencesToBeDeleted.map((reference) => this.delete({_id: reference._id}));
        if (propertyHub.length > 1) {
          actions = actions.concat(this.save(propertyHub, language));
        }
        return Promise.all(actions);
      })).catch(console.log);
    });
  },

  search(entitySharedId, query, language) {

    return Promise.all([this.getByDocument(entitySharedId, language), entities.getById(entitySharedId, language)])
    .then(([relationships, entity]) => {
      let filter = Object.keys(query.filter).reduce((result, filterGroupKey) => {
        return result.concat(query.filter[filterGroupKey]);
      }, []);
      let filteredRelationships = relationships.filter((relationship) => {
        return !filter.length || filter.includes(relationship.template + relationship.entityData.template);
      });

      let ids = filteredRelationships
      .map((relationship) => relationship.entity)
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

      return search.search(query, language)
      .then(results => {
        results.rows.forEach(item => {
          item.connections = filteredRelationships.filter((relationship) => relationship.entity === item.sharedId);
        });
        if (results.rows.length) {
          let filteredRelationshipsHubs = results.rows.map((item) => item.connections.map((relationship) => relationship.hub.toString()));
          filteredRelationshipsHubs = Array.prototype.concat(...filteredRelationshipsHubs);
          entity.connections = relationships.filter((relationship) => {
            return relationship.entity === entitySharedId && filteredRelationshipsHubs.includes(relationship.hub.toString());
          });
          results.rows.push(entity);
        }
        return results;
      });
    });
  },

  delete(condition) {
    return model.get(condition)
    .then((relationships) => {
      return Promise.all(relationships.map((relation) => model.delete({_id: relation._id})))
      .then(() => {
        return Promise.all(relationships.map((relation) => model.get({hub: relation.hub})));
      });
    })
    .then((hubs) => {
      return Promise.all(hubs.map((hub) => {
        const shouldDeleteTheLoneConnectionToo = hub.length === 1;
        if (shouldDeleteTheLoneConnectionToo) {
          return model.delete({hub: hub[0].hub});
        }

        return Promise.resolve();
      }));
    })
    .catch(console.log);
  },

  deleteTextReferences(sharedId, language) {
    return model.delete({entity: sharedId, language});
  },

  updateMetadataProperties(template, currentTemplate) {
    let actions = {};
    actions.$rename = {};
    actions.$unset = {};
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

    return model.db.updateMany({template}, actions);
  }
};
