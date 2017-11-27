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
  const selects = template.properties.filter((prop) => prop.type === 'select' || prop.type === 'multiselect');
  const entitySelects = [];
  return Promise.all(selects.map((select) => {
    return templatesAPI.getById(select.content)
    .then((result) => {
      if (result) {
        entitySelects.push(select.name);
      }
    });
  }))
  .then(() => entitySelects);
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
      let connectedEntityiesSharedId = connections.filter((connection) => connection.entity !== id).map((connection) => connection.entity);
      return entities.get({sharedId: {$in: connectedEntityiesSharedId}, language})
      .then((_connectedDocuments) => {
        const connectedDocuments = _connectedDocuments.reduce((res, doc) => {
          res[doc.sharedId] = doc;
          return res;
        }, {});
        return connections.map((connection) => {
          if (connection.entity === id) {
            return connection;
          }
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

  getByTarget(docId) {
    return model.get({targetDocument: docId});
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
        .then(normalizeConnection)
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
        let propertyValues = entity.metadata[property] || [];
        if (typeof propertyValues === 'string') {
          propertyValues = [propertyValues];
        }
        return memo.concat(propertyValues.map(value => {
          return {property, value};
        }));
      }, []);

      const toDelete = references.filter((ref) => {
        let isInValues = false;
        values.forEach((item) => {
          if (item.property === ref.entityProperty && ref.targetDocument === item.value) {
            isInValues = true;
          }
        });
        return !ref.inbound && !isInValues && ref.entityType === 'metadata';
      });

      const toCreate = values.filter((item) => {
        let isInReferences = false;
        references.forEach((ref) => {
          if (item.property === ref.entityProperty && ref.targetDocument === item.value) {
            isInReferences = true;
          }
        });
        return !isInReferences;
      });

      const deletes = toDelete.map((ref) => this.delete(ref._id));
      const creates = toCreate.map((item) => this.save({
        entityType: 'metadata',
        entityDocument: entity.sharedId,
        targetDocument: item.value,
        entityProperty: item.property,
        entityTemplate: entity.template
      }, language));


      return Promise.all(deletes.concat(creates));
    });
  },

  delete(condition) {
    return model.delete(condition);
  },

  deleteTextReferences(sharedId, language) {
    return model.delete({sourceDocument: sharedId, language});
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
  },

  updateMetadataConnections(changedTemplate) {
    changedTemplate.properties = changedTemplate.properties || [];
    return templatesAPI.getById(changedTemplate._id)
    .then((currentTemplate) => {
      let changedProperties = {};
      changedTemplate.properties.forEach((property) => {
        let currentProperty = currentTemplate.properties.find(p => p.id === property.id);
        if (currentProperty && currentProperty.name !== property.name) {
          changedProperties[currentProperty.name] = property.name;
        }
      });
      let deletedProperties = [];
      currentTemplate.properties = currentTemplate.properties || [];
      currentTemplate.properties.forEach((property) => {
        if (!changedTemplate.properties.find(p => p.id === property.id)) {
          deletedProperties.push(property.name);
        }
      });

      let queries = Object.keys(changedProperties).map((oldPropertyName) => {
        return model.db.updateMany(
          {sourceType: 'metadata', sourceTemplate: currentTemplate._id, sourceProperty: oldPropertyName},
          {$set: {sourceProperty: changedProperties[oldPropertyName]}});
      });

      deletedProperties.forEach((deletedProperty) => {
        queries.push(this.delete({sourceType: 'metadata', sourceTemplate: currentTemplate._id, sourceProperty: deletedProperty}));
      });

      return Promise.all(queries);
    });
  }
};
