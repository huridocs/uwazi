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
      let values = properties.reduce((memo, property) => {
        let propertyValues = entity.metadata[property.name] || [];
        if (typeof propertyValues === 'string') {
          propertyValues = [propertyValues];
        }
        return memo.concat(propertyValues.map(value => {
          return {property, value};
        }));
      }, []);

      const toDelete = references.filter((reference) => {
        let isInValues = false;
        const isOwnReference = reference.entity === entity.sharedId;
        values.forEach((item) => {
          if (reference.entity === item.value) {
            isInValues = true;
          }
        });

        return !isInValues && !isOwnReference;
      });

      const toCreate = values.filter((item) => {
        let isInReferences = false;
        references.forEach((ref) => {
          if (ref.entity === item.value) {
            isInReferences = true;
          }
        });
        return !isInReferences;
      });

      let defaultMetadataReference = {
        entity: entity.sharedId,
        hub: generateID()
      };
      let metadataReference = references.find((ref) => ref.entity === entity.sharedId) || defaultMetadataReference;
      const deletes = toDelete.map((ref) => this.delete({_id: ref._id}));
      let toCreateReferences = toCreate.map((item) => {
        return {
          entity: item.value,
          hub: metadataReference.hub,
          template: item.property.template
        };
      });

      let saves = [];
      if (toCreateReferences.length) {
        toCreateReferences = toCreateReferences.concat(metadataReference);
        saves = this.save(toCreateReferences, language);
      }

      return Promise.all(deletes.concat(saves));
    });
  },

  delete(condition) {
    return model.get(condition)
    .then((relationships) => {
      return Promise.all(relationships.map((relationship) => {
        return this.getHub(relationship.hub)
        .then((hub) => [relationship, hub]);
      }));
    })
    .then((hubs) => {
      return Promise.all(hubs.map(([relationship, hub]) => {
        const shouldDeleteTheLoneConnectionToo = hub.length === 2;
        if (shouldDeleteTheLoneConnectionToo) {
          return model.delete({hub: hub[0].hub});
        }

        return model.delete({_id: relationship._id});
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
