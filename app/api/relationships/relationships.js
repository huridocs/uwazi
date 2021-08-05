import { fromJS } from 'immutable';
import templatesAPI from 'api/templates';
import settings from 'api/settings';
import relationtypes from 'api/relationtypes';
import entities from 'api/entities/entities';
import { generateID } from 'api/odm';
import { createError } from 'api/utils';

import model from './model';
import { search } from '../search';
import { generateNamesAndIds } from '../templates/utils';

import { filterRelevantRelationships, groupRelationships } from './groupByRelationships';
import {
  RelationshipCollection,
  getEntityReferencesByRelationshipTypes,
  guessRelationshipPropertyHub,
} from './relationshipsHelpers';
import { validateConnectionSchema } from './validateConnectionSchema';

const normalizeConnectedDocumentData = (relationship, connectedDocument) => {
  relationship.entityData = connectedDocument;
  return relationship;
};

function excludeRefs(template) {
  delete template.refs;
  return template;
}

function getPropertiesToBeConnections(template) {
  const props = [];
  template.properties.forEach(prop => {
    const repeated = props.find(
      p => p.content === prop.content && p.relationType === prop.relationType
    );

    if (prop.type === 'relationship' && !repeated) {
      props.push(prop);
    }
  });
  return props;
}

const createRelationship = async relationship => model.save(relationship);

const updateRelationship = async relationship =>
  model.save({
    ...relationship,
    template:
      relationship.template && relationship.template._id !== null ? relationship.template : null,
  });

// Code mostly copied from react/Relationships/reducer/hubsReducer.js, abstract this QUICKLY!!!
const conformRelationships = (rows, parentEntitySharedId) => {
  let order = -1;
  const hubsObject = fromJS(rows || []).reduce((hubs, row) => {
    let hubsImmutable = hubs;
    row.get('connections').forEach(connection => {
      const hubId = connection.get('hub').toString();
      if (!hubsImmutable.has(hubId)) {
        order += 1;
        hubsImmutable = hubsImmutable.set(
          hubId,
          fromJS({ hub: hubId, order, leftRelationship: {}, rightRelationships: {} })
        );
      }

      if (row.get('sharedId') === parentEntitySharedId) {
        hubsImmutable = hubsImmutable.setIn([hubId, 'leftRelationship'], connection);
      } else {
        const templateId = connection.get('template');
        if (!hubsImmutable.getIn([hubId, 'rightRelationships']).has(templateId)) {
          hubsImmutable = hubsImmutable.setIn(
            [hubId, 'rightRelationships', templateId],
            fromJS([])
          );
        }
        const newConnection = connection.set('entity', row.delete('connections'));
        hubsImmutable = hubsImmutable.setIn(
          [hubId, 'rightRelationships', templateId],
          hubsImmutable.getIn([hubId, 'rightRelationships', templateId]).push(newConnection)
        );
      }
    });

    return hubsImmutable;
  }, fromJS({}));

  return hubsObject.reduce((hubs, hub) => {
    const rightRelationships = hub
      .get('rightRelationships')
      .reduce((memo, relationshipsArray, template) => {
        const newMemo = memo.push(
          fromJS({})
            .set('template', template)
            .set('relationships', relationshipsArray)
        );
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

const determinePropertyValues = (entity, propertyName) => {
  const metadata = entity.metadata || {};
  const propertyValues = metadata[propertyName] || [];
  return propertyValues.map(mo => mo.value);
};

export default {
  get(query, select, pagination) {
    return model.get(query, select, pagination);
  },

  getById(id) {
    return model.getById(id);
  },

  async getDocumentHubs(entity, file, onlyTextReferences) {
    let ownRelations;
    if (onlyTextReferences) {
      ownRelations = await model.get(
        {
          entity,
          $and: [{ file: { $exists: true } }, { file }],
        },
        {},
        { limit: 300 }
      );
    } else {
      ownRelations = await model.get({
        entity,
        $or: [
          { $and: [{ file: { $exists: false } }] },
          file ? { $and: [{ file: { $exists: true } }, { file }] } : {},
        ],
      });
    }

    const hubsIds = ownRelations.map(relationship => relationship.hub);
    return model.get({ hub: { $in: hubsIds } });
  },

  getByDocument(sharedId, language, unpublished = true, file, onlyTextReferences = false) {
    return this.getDocumentHubs(sharedId, file, onlyTextReferences).then(_relationships => {
      const connectedEntitiesSharedId = _relationships.map(relationship => relationship.entity);
      return entities
        .getUnrestrictedWithDocuments({ sharedId: { $in: connectedEntitiesSharedId }, language }, [
          'template',
          'creationDate',
          'title',
          'file',
          'sharedId',
          'uploaded',
          'processed',
          'type',
          'published',
          'metadata',
        ])
        .then(_connectedDocuments => {
          const connectedDocuments = _connectedDocuments.reduce((res, doc) => {
            res[doc.sharedId] = doc;
            return res;
          }, {});

          let relationshipsCollection = new RelationshipCollection(..._relationships)
            .removeOtherLanguageTextReferences(connectedDocuments)
            .withConnectedData(connectedDocuments)
            .removeSingleHubs()
            .removeOrphanHubsOf(sharedId);

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
      templatesAPI.get(),
      relationtypes.get(),
    ]).then(([references, templates, relationTypes]) => {
      const relevantReferences = filterRelevantRelationships(
        references,
        id,
        language,
        options.user
      );
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
    return model.get({ hub });
  },

  countByRelationType(typeId) {
    return model.count({ template: typeId });
  },

  getAllLanguages(sharedId) {
    return model.get({ sharedId });
  },

  async bulk(bulkData, language) {
    const saves = await Promise.all(bulkData.save.map(reference => this.save(reference, language)));
    const deletions = await Promise.all(
      bulkData.delete.map(reference => this.delete(reference, language))
    );
    return saves.concat(deletions);
  },

  async save(_relationships, language, updateEntities = true) {
    if (!language) {
      throw createError('Language cant be undefined');
    }

    const rel = !Array.isArray(_relationships) ? [_relationships] : _relationships;

    await validateConnectionSchema(rel);

    const existingEntities = (
      await entities.get({
        sharedId: { $in: rel.map(r => r.entity) },
        language,
      })
    ).map(r => r.sharedId);

    const relationships = rel.filter(r => existingEntities.includes(r.entity));

    if (relationships.length === 0) {
      return [];
    }

    if (relationships.length === 1 && !relationships[0].hub) {
      throw createError('Single relationships must have a hub');
    }

    const hub = relationships[0].hub || generateID();

    const result = await Promise.all(
      relationships.map(relationship => {
        const action = relationship._id ? updateRelationship : createRelationship;

        return action({ ...relationship, hub }, language)
          .then(savedRelationship =>
            Promise.all([savedRelationship, entities.getById(savedRelationship.entity, language)])
          )
          .then(([savedRelationship, connectedEntity]) =>
            normalizeConnectedDocumentData(savedRelationship, connectedEntity)
          );
      })
    );

    if (updateEntities) {
      await this.updateEntitiesMetadataByHub(hub, language);
    }
    return result;
  },

  async updateEntitiesMetadataByHub(hubId, language) {
    const hub = await this.getHub(hubId);
    const entitiesIds = hub.map(r => r.entity);
    return entities.updateMetdataFromRelationships(entitiesIds, language);
  },

  updateEntitiesMetadata(entitiesIds, language) {
    return entities.updateMetdataFromRelationships(entitiesIds, language);
  },

  async saveEntityBasedReferences(entity, language) {
    if (!language) throw createError('Language cant be undefined');
    if (!entity.template) return [];

    const template = await templatesAPI.getById(entity.template);
    const relationshipProperties = getPropertiesToBeConnections(template);

    if (!relationshipProperties.length) return [];

    const existingReferences = await getEntityReferencesByRelationshipTypes(
      entity.sharedId,
      relationshipProperties.map(p => generateID(p.relationType))
    );

    return Promise.all(
      // eslint-disable-next-line max-statements
      relationshipProperties.map(async property => {
        const newValues = determinePropertyValues(entity, property.name);
        const { relationType: propertyRelationType, content: propertyEntityType } = property;

        let referencesOfThisType = existingReferences.find(
          g => g._id.toString() === propertyRelationType.toString()
        );
        referencesOfThisType = (referencesOfThisType && referencesOfThisType.references) || [];

        const toCreate = newValues.filter(
          value => !referencesOfThisType.find(r => r.rightSide.entity === value)
        );

        if (toCreate.length) {
          const candidateHub = await guessRelationshipPropertyHub(
            entity.sharedId,
            generateID(propertyRelationType)
          );

          const hubId = (candidateHub[0] && candidateHub[0]._id) || generateID();
          const newReferencesBase = candidateHub[0]
            ? []
            : [{ entity: entity.sharedId, hub: hubId }];

          const newReferences = toCreate.map(value => ({
            entity: value,
            hub: hubId,
            template: generateID(propertyRelationType),
          }));

          await this.save([...newReferencesBase, ...newReferences], language, false);
        }

        const matchingRefsNotInNewSet = r =>
          r.rightSide.entity !== entity.sharedId &&
          (!propertyEntityType ||
            r.rightSide.entityData[0].template.toString() === propertyEntityType) &&
          !newValues.includes(r.rightSide.entity);

        const toDelete = referencesOfThisType
          .filter(matchingRefsNotInNewSet)
          .map(r => r.rightSide._id);

        if (toDelete.length) {
          await this.delete(
            {
              _id: { $in: toDelete },
            },
            language,
            false
          );
        }

        return [];
      })
    );
  },

  search(entitySharedId, query, language, user) {
    const hubsLimit = query.limit || 0;

    if (!language) {
      return Promise.reject(createError('Language cant be undefined'));
    }
    return Promise.all([
      this.getByDocument(entitySharedId, language),
      entities.getById(entitySharedId, language),
    ]).then(([relationships, entity]) => {
      relationships.sort((a, b) =>
        (a.entity + a.hub.toString()).localeCompare(b.entity + b.hub.toString())
      );

      const filter = Object.keys(query.filter).reduce(
        (result, filterGroupKey) => result.concat(query.filter[filterGroupKey]),
        []
      );
      const filteredRelationships = relationships.filter(
        relationship =>
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

      return search.search(query, language, user).then(results => {
        results.rows.forEach(item => {
          item.connections = filteredRelationships.filter(
            relationship => relationship.entity === item.sharedId
          );
        });

        if (results.rows.length) {
          let filteredRelationshipsHubs = results.rows.map(item =>
            item.connections.map(relationship => relationship.hub.toString())
          );
          filteredRelationshipsHubs = Array.prototype.concat(...filteredRelationshipsHubs);
          entity.connections = relationships.filter(
            relationship =>
              relationship.entity === entitySharedId &&
              filteredRelationshipsHubs.includes(relationship.hub.toString())
          );
          results.rows.push(entity);
        }

        return limitRelationshipResults(results, entitySharedId, hubsLimit);
      });
    });
  },

  async delete(relationQuery, _language, updateMetdata = true) {
    if (!relationQuery) {
      return Promise.reject(createError('Cant delete without a condition'));
    }

    const unique = (elem, pos, arr) => arr.indexOf(elem) === pos;
    const relationsToDelete = await model.get(relationQuery, 'hub');
    const hubsAffected = relationsToDelete.map(r => r.hub).filter(unique);

    const { languages } = await settings.get();
    const entitiesAffected = await model.db.aggregate([
      { $match: { hub: { $in: hubsAffected } } },
      { $group: { _id: '$entity' } },
    ]);

    const response = await model.delete(relationQuery);

    const hubsToDelete = await model.db.aggregate([
      { $match: { hub: { $in: hubsAffected } } },
      { $group: { _id: '$hub', length: { $sum: 1 } } },
      { $match: { length: { $lt: 2 } } },
    ]);

    await model.delete({ hub: { $in: hubsToDelete.map(h => h._id) } });

    if (updateMetdata) {
      await Promise.all(
        languages.map(l =>
          this.updateEntitiesMetadata(
            entitiesAffected.map(e => e._id),
            l.key
          )
        )
      );
    }

    return response;
  },

  async deleteTextReferences(sharedId, language) {
    const [{ _id, file = {} }] = await entities.get({ sharedId, language }, 'file');
    const languagesWithSameFile = await entities.count({
      'file.filename': file.filename,
      sharedId,
      _id: { $ne: _id },
    });
    if (!languagesWithSameFile && file.filename) {
      return this.delete({ filename: file.filename });
    }
    return Promise.resolve();
  },

  async updateMetadataProperties(template, currentTemplate) {
    const actions = {};
    actions.$rename = {};
    actions.$unset = {};
    template.properties = await generateNamesAndIds(template.properties);
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

    return model.updateMany({ template }, actions);
  },

  count: model.count.bind(model),
};
