"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _immutable = require("immutable");
var _templates = _interopRequireDefault(require("../templates"));
var _settings = _interopRequireDefault(require("../settings"));
var _relationtypes = _interopRequireDefault(require("../relationtypes"));
var _entities = _interopRequireDefault(require("../entities/entities"));
var _odm = require("../odm");
var _utils = require("../utils");

var _model = _interopRequireDefault(require("./model"));
var _search = _interopRequireDefault(require("../search/search"));
var _utils2 = require("../templates/utils");

var _groupByRelationships = require("./groupByRelationships");
var _relationshipsHelpers = require("./relationshipsHelpers");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

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

const createRelationship = async (relationship, language) => {
  const isATextReference = relationship.range;
  let filename;
  if (isATextReference) {
    const [entity] = await _entities.default.get({ sharedId: relationship.entity, language });
    ({ filename } = entity.file);
  }

  return _model.default.save(_objectSpread({}, relationship, { filename }));
};

const updateRelationship = async relationship => _model.default.save(_objectSpread({},
relationship, {
  template: relationship.template && relationship.template._id !== null ? relationship.template : null }));


function findPropertyHub(propertyRelationType, hubs, entitySharedId) {
  return hubs.reduce((result, hub) => {
    const allReferencesAreOfTheType = hub.every(
    reference => reference.entity === entitySharedId ||
    reference.template && reference.template.toString() === propertyRelationType);

    if (allReferencesAreOfTheType) {
      return hub;
    }

    return result;
  }, null);
}

// Code mostly copied from react/Relationships/reducer/hubsReducer.js, abstract this QUICKLY!!
const conformRelationships = (rows, parentEntitySharedId) => {
  let order = -1;
  const hubsObject = (0, _immutable.fromJS)(rows).
  reduce((hubs, row) => {
    let hubsImmutable = hubs;
    row.get('connections').forEach(connection => {
      const hubId = connection.get('hub').toString();
      if (!hubsImmutable.has(hubId)) {
        order += 1;
        hubsImmutable = hubsImmutable.set(hubId, (0, _immutable.fromJS)({ hub: hubId, order, leftRelationship: {}, rightRelationships: {} }));
      }

      if (row.get('sharedId') === parentEntitySharedId) {
        hubsImmutable = hubsImmutable.setIn([hubId, 'leftRelationship'], connection);
      } else {
        const templateId = connection.get('template');
        if (!hubsImmutable.getIn([hubId, 'rightRelationships']).has(templateId)) {
          hubsImmutable = hubsImmutable.setIn([hubId, 'rightRelationships', templateId], (0, _immutable.fromJS)([]));
        }
        const newConnection = connection.set('entity', row.delete('connections'));
        hubsImmutable = hubsImmutable.setIn([hubId, 'rightRelationships', templateId],
        hubsImmutable.getIn([hubId, 'rightRelationships', templateId]).push(newConnection));
      }
    });

    return hubsImmutable;
  }, (0, _immutable.fromJS)({}));

  return hubsObject.reduce((hubs, hub) => {
    const rightRelationships = hub.get('rightRelationships').reduce((memo, relationshipsArray, template) => {
      const newMemo = memo.push((0, _immutable.fromJS)({}).set('template', template).set('relationships', relationshipsArray));
      return newMemo;
    }, (0, _immutable.fromJS)([]));
    return hubs.set(hub.get('order'), hub.set('rightRelationships', rightRelationships));
  }, (0, _immutable.fromJS)([]));
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

const determinePropertyValues = (entity, propertyName) => {
  const metadata = entity.metadata || {};
  const propertyValues = metadata[propertyName] || [];
  return typeof propertyValues === 'string' ? [propertyValues] : propertyValues;
};

const getHub = (propertyRelationType, hubs, sharedId) => {
  const hub = findPropertyHub(propertyRelationType, hubs, sharedId);
  return hub || [{ entity: sharedId, hub: (0, _odm.generateID)() }];
};

const determineReferenceValues = (references, property, entity) => {
  const hubs = (0, _relationshipsHelpers.groupByHubs)(references);
  const propertyRelationType = property.relationType.toString();
  const entityType = property.content;
  const hub = getHub(propertyRelationType, hubs, entity.sharedId);

  return { propertyRelationType, entityType, hub };
};var _default =

{
  get(query, select, pagination) {
    return _model.default.get(query, select, pagination);
  },

  getById(id) {
    return _model.default.getById(id);
  },

  async getDocumentHubs(entity) {
    const ownRelations = await _model.default.get({ entity });
    const hubsIds = ownRelations.map(relationship => relationship.hub);
    return _model.default.get({ hub: { $in: hubsIds } });
  },

  getByDocument(sharedId, language, unpublished = true) {
    return this.getDocumentHubs(sharedId).
    then(_relationships => {
      const connectedEntitiesSharedId = _relationships.map(relationship => relationship.entity);
      return _entities.default.get(
      { sharedId: { $in: connectedEntitiesSharedId }, language },
      ['template', 'creationDate', 'title', 'file', 'sharedId', 'uploaded', 'processed', 'type', 'published', 'metadata']).

      then(_connectedDocuments => {
        const connectedDocuments = _connectedDocuments.reduce((res, doc) => {
          res[doc.sharedId] = doc;
          return res;
        }, {});
        let relationshipsCollection = new _relationshipsHelpers.RelationshipCollection(..._relationships).
        removeOtherLanguageTextReferences(connectedDocuments).
        withConnectedData(connectedDocuments).
        removeSingleHubs().
        removeOrphanHubsOf(sharedId);

        if (!unpublished) {
          relationshipsCollection = relationshipsCollection.removeUnpublished();
        }

        return relationshipsCollection;
      });
    });
  },

  getGroupsByConnection(id, language, options = {}) {
    return Promise.all([
    this.getByDocument(id, language),
    _templates.default.get(),
    _relationtypes.default.get()]).

    then(([references, templates, relationTypes]) => {
      const relevantReferences = (0, _groupByRelationships.filterRelevantRelationships)(references, id, language, options.user);
      const groupedReferences = (0, _groupByRelationships.groupRelationships)(relevantReferences, templates, relationTypes);

      if (options.excludeRefs) {
        groupedReferences.forEach(g => {
          g.templates = g.templates.map(excludeRefs);
        });
      }
      return groupedReferences;
    });
  },

  getHub(hub) {
    return _model.default.get({ hub });
  },

  countByRelationType(typeId) {
    return _model.default.count({ template: typeId });
  },

  getAllLanguages(sharedId) {
    return _model.default.get({ sharedId });
  },

  async bulk(bulkData, language) {
    const saves = await Promise.all(bulkData.save.map(reference => this.save(reference, language)));
    const deletions = await Promise.all(bulkData.delete.map(reference => this.delete(reference, language)));
    return saves.concat(deletions);
  },


  async save(_relationships, language) {
    if (!language) {
      throw (0, _utils.createError)('Language cant be undefined');
    }

    const rel = !Array.isArray(_relationships) ? [_relationships] : _relationships;

    const existingEntities = (await _entities.default.get({ sharedId: { $in: rel.map(r => r.entity) }, language })).
    map(r => r.sharedId);

    const relationships = rel.filter(r => existingEntities.includes(r.entity));

    if (relationships.length === 0) {
      return [];
    }

    if (relationships.length === 1 && !relationships[0].hub) {
      throw (0, _utils.createError)('Single relationships must have a hub');
    }

    const hub = relationships[0].hub || (0, _odm.generateID)();

    const result = await Promise.all(relationships.map(relationship => {
      const action = relationship._id ? updateRelationship : createRelationship;

      return action(_objectSpread({}, relationship, { hub }), language).
      then(savedRelationship => Promise.all([savedRelationship, _entities.default.getById(savedRelationship.entity, language)])).
      then(([savedRelationship, connectedEntity]) => normalizeConnectedDocumentData(savedRelationship, connectedEntity));
    }));

    await this.updateEntitiesMetadataByHub(hub, language);
    return result;
  },

  updateEntitiesMetadataByHub(hubId, language) {
    return this.getHub(hubId).
    then(hub => _entities.default.updateMetdataFromRelationships(hub.map(r => r.entity), language));
  },

  updateEntitiesMetadata(entitiesIds, language) {
    return _entities.default.updateMetdataFromRelationships(entitiesIds, language);
  },

  saveEntityBasedReferences(entity, language) {
    if (!language) {
      return Promise.reject((0, _utils.createError)('Language cant be undefined'));
    }

    if (!entity.template) {
      return Promise.resolve([]);
    }

    return _templates.default.getById(entity.template).
    then(getPropertiesToBeConnections).
    then(properties => Promise.all([properties, this.getByDocument(entity.sharedId, language)])).
    then(([properties, references]) => Promise.all(properties.map(property => {
      const propertyValues = determinePropertyValues(entity, property.name);
      const { propertyRelationType, entityType, hub } = determineReferenceValues(references, property, entity);

      const referencesOfThisType = references.filter(reference => reference.template &&
      reference.template.toString() === propertyRelationType.toString());


      propertyValues.forEach(entitySharedId => {
        const relationshipDoesNotExists = !referencesOfThisType.find(reference => reference.entity === entitySharedId);
        if (relationshipDoesNotExists) {
          hub.push({ entity: entitySharedId, hub: hub[0].hub, template: propertyRelationType });
        }
      });
      const referencesToBeDeleted = references.filter(reference => !(reference.entity === entity.sharedId) &&
      reference.template && reference.template.toString() === propertyRelationType && (
      !entityType || reference.entityData.template.toString() === entityType) &&
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
      return Promise.reject((0, _utils.createError)('Language cant be undefined'));
    }
    return Promise.all([this.getByDocument(entitySharedId, language), _entities.default.getById(entitySharedId, language)]).
    then(([relationships, entity]) => {
      relationships.sort((a, b) => (a.entity + a.hub.toString()).localeCompare(b.entity + b.hub.toString()));

      const filter = Object.keys(query.filter).reduce((result, filterGroupKey) => result.concat(query.filter[filterGroupKey]), []);
      const filteredRelationships = relationships.filter(relationship => !filter.length ||
      filter.includes(relationship.template + relationship.entityData.template));


      const ids = filteredRelationships.
      map(relationship => relationship.entity).
      reduce((result, id) => {
        if (!result.includes(id) && id !== entitySharedId) {
          result.push(id);
        }
        return result;
      }, []);
      query.ids = ids.length ? ids : ['no_results'];
      query.includeUnpublished = true;
      query.limit = 9999;
      delete query.filter;

      return _search.default.search(query, language, user).
      then(results => {
        results.rows.forEach(item => {
          item.connections = filteredRelationships.filter(relationship => relationship.entity === item.sharedId);
        });

        if (results.rows.length) {
          let filteredRelationshipsHubs = results.rows.map(item => item.connections.map(relationship => relationship.hub.toString()));
          filteredRelationshipsHubs = Array.prototype.concat(...filteredRelationshipsHubs);
          entity.connections = relationships.filter(relationship => relationship.entity === entitySharedId &&
          filteredRelationshipsHubs.includes(relationship.hub.toString()));

          results.rows.push(entity);
        }


        return limitRelationshipResults(results, entitySharedId, hubsLimit);
      });
    });
  },

  async delete(relationQuery, language, updateMetdata = true) {
    if (!relationQuery) {
      return Promise.reject((0, _utils.createError)('Cant delete without a condition'));
    }

    const unique = (elem, pos, arr) => arr.indexOf(elem) === pos;
    const relationsToDelete = await _model.default.get(relationQuery, 'hub');
    const hubsAffected = relationsToDelete.map(r => r.hub).filter(unique);

    const { languages } = await _settings.default.get();
    const entitiesAffected = await _model.default.db.aggregate([
    { $match: { hub: { $in: hubsAffected } } },
    { $group: { _id: '$entity' } }]);


    const response = await _model.default.delete(relationQuery);

    const hubsToDelete = await _model.default.db.aggregate([
    { $match: { hub: { $in: hubsAffected } } },
    { $group: { _id: '$hub', length: { $sum: 1 } } },
    { $match: { length: { $lt: 2 } } }]);


    await _model.default.delete({ hub: { $in: hubsToDelete.map(h => h._id) } });

    if (updateMetdata) {
      await Promise.all(languages.map(l => this.updateEntitiesMetadata(entitiesAffected.map(e => e._id), l.key)));
    }

    return response;
  },

  async deleteTextReferences(sharedId, language) {
    const [{ _id, file = {} }] = await _entities.default.get({ sharedId, language }, 'file');
    const languagesWithSameFile = await _entities.default.count({ 'file.filename': file.filename, sharedId, _id: { $ne: _id } });
    if (!languagesWithSameFile && file.filename) {
      return this.delete({ filename: file.filename });
    }
    return Promise.resolve();
  },

  updateMetadataProperties(template, currentTemplate) {
    const actions = {};
    actions.$rename = {};
    actions.$unset = {};
    template.properties = (0, _utils2.generateNamesAndIds)(template.properties);
    template.properties.forEach(property => {
      const currentProperty = currentTemplate.properties.find(p => p.id === property.id);
      if (currentProperty && currentProperty.name !== property.name) {
        actions.$rename[`metadata.${currentProperty.name}`] = `metadata.${property.name}`;
      }
    });
    currentTemplate.properties = currentTemplate.properties || [];
    currentTemplate.properties.forEach(property => {
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

    return _model.default.db.updateMany({ template }, actions);
  },

  count: _model.default.count };exports.default = _default;