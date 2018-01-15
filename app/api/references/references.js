import templatesAPI from 'api/templates';
import relationTypesAPI from 'api/relationtypes/relationtypes';
import {generateNamesAndIds} from '../templates/utils';
import entities from '../entities';

import model from './connectionsModel.js';
import {generateID} from 'api/odm';
import {createError} from 'api/utils';

import {filterRelevantReferences, groupReferences} from './groupByConnection';

let normalizeConnection = (connection) => {
  connection.range = connection.range || {text: ''};
  return connection;
};

let normalizeConnectedDocumentData = (connection, connectedDocument) => {
  connection.entityData = connectedDocument;
  return connection;
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
  hubs.reduce((result, hub) => {
    const allReferencesAreOfTheType = hub.every((reference) => reference.entity === entitySharedId || reference.template === propertyRelationType);
    if (allReferencesAreOfTheType) {
      return hub;
    }
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
    .then((ownConnections) => {
      const hubs = ownConnections.map(connection => connection.hub);
      return model.get({hub: {$in: hubs}});
    })
    .then((response) => {
      let connections = response.map((connection) => normalizeConnection(connection, id));
      let connectedEntityiesSharedId = connections.map((connection) => connection.entity);
      return entities.get({sharedId: {$in: connectedEntityiesSharedId}, language})
      .then((_connectedDocuments) => {
        const connectedDocuments = _connectedDocuments.reduce((res, doc) => {
          res[doc.sharedId] = doc;
          return res;
        }, {});
        return connections.map((connection) => {
          return normalizeConnectedDocumentData(connection, connectedDocuments[connection.entity]);
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
      const relevantReferences = filterRelevantReferences(references, language, options.user);
      const groupedReferences = groupReferences(relevantReferences, templates, relationTypes);

      if (options.excludeRefs) {
        groupedReferences.forEach(g => {
          g.templates = g.templates.map(excludeRefs);
        });
      }
      console.log('4');
      return groupedReferences;
    });
  },

  getHub(hub) {
    return model.get({hub});
  },

  countByRelationType(typeId) {
    return model.count({template: typeId});
  },

  save(_connections, language) {
    let connections = _connections;
    if (!Array.isArray(connections)) {
      connections = [connections];
    }

    if (connections.length === 1 && !connections[0].hub) {
      return Promise.reject(createError('Single connections must have a hub'));
    }
    const hub = connections[0].hub || generateID();
    return Promise.all(
      connections.map((connection) => {
        connection.hub = hub;
        return model.save(connection)
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
