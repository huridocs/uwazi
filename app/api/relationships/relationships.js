import { fromJS } from 'immutable';
import _ from 'lodash';

import templatesAPI from 'api/templates';
import settings from 'api/settings';
import relationtypes from 'api/relationtypes';
import entities from 'api/entities/entities';
import { createError } from 'api/utils';

import { ObjectId } from 'mongodb';
import model from './model';
import { search } from '../search';
import { generateNames } from '../templates/utils';

import { filterRelevantRelationships, groupRelationships } from './groupByRelationships';
import {
  processRelationshipCollection,
  getEntityReferencesByRelationshipTypes,
  guessRelationshipPropertyHub,
} from './relationshipsHelpers';
import { validateConnectionSchema } from './validateConnectionSchema';

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
          fromJS({}).set('template', template).set('relationships', relationshipsArray)
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
        ...(file
          ? {
              $or: [
                { file: { $exists: false } },
                file ? { $and: [{ file: { $exists: true } }, { file }] } : {},
              ],
            }
          : {}),
      });
    }
    const hubsIds = ownRelations.map(relationship => relationship.hub);
    return model.get({ hub: { $in: hubsIds } });
  },

  getByDocument(
    sharedId,
    language,
    unpublished = true,
    file = undefined,
    onlyTextReferences = false,
    unrestricted = true
  ) {
    return this.getDocumentHubs(sharedId, file, onlyTextReferences).then(_relationships => {
      const connectedEntitiesSharedId = _relationships.map(relationship => relationship.entity);
      const method = unrestricted ? 'getUnrestrictedWithDocuments' : 'get';
      return entities[method]({ sharedId: { $in: connectedEntitiesSharedId }, language }, [
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
        'icon',
      ]).then(_connectedDocuments => {
        const connectedDocuments = _connectedDocuments.reduce((res, doc) => {
          res[doc.sharedId] = doc;
          return res;
        }, {});

        const relationshipsCollection = processRelationshipCollection(
          _relationships,
          connectedDocuments,
          sharedId,
          unpublished
        );

        return relationshipsCollection;
      });
    });
  },

  getGroupsByConnection(id, language, options = {}) {
    return Promise.all([
      this.getByDocument(id, language, undefined, undefined, undefined, false),
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
    const saves = await this.save(bulkData.save, language);
    const deletions = await this.delete(
      { _id: { $in: bulkData.delete.map(r => r._id) } },
      language
    );
    return { saves, deletions };
  },

  arrangeRelationshipGroups(_relationships) {
    if (!Array.isArray(_relationships)) return [[_relationships]];

    const [groups, ungrouped] = _.partition(_relationships, relOrGroup =>
      Array.isArray(relOrGroup)
    );

    if (ungrouped.length) groups.push(ungrouped);

    return groups;
  },

  async prepareRelationshipsToSave(_relationships, language) {
    const rels = this.arrangeRelationshipGroups(_relationships);
    const relsFlat = rels.flat();
    await validateConnectionSchema(relsFlat);

    const existingEntities = new Set(
      (
        await entities.get({
          sharedId: { $in: relsFlat.map(r => r.entity) },
          language,
        })
      ).map(r => r.sharedId)
    );

    const relationships = rels.map(_group => {
      let group = _group.filter(r => existingEntities.has(r.entity));
      if (group.length === 1 && !group[0].hub) {
        throw createError('Single relationships must have a hub');
      }
      if (!(group.every(r => !r.hub) || group.every(r => !!r.hub))) {
        throw createError('In a group, either all relationships must have a hub or none of them.');
      }
      if (group.length && !group[0].hub) {
        const newHub = new ObjectId();
        group = group.map(r => ({ ...r, hub: r.hub || newHub }));
      }
      return group;
    });

    return relationships.flat();
  },

  async appendRelatedEntityData(savedRelationships, language) {
    const relatedEntities = {};
    (
      await entities.get(
        {
          sharedId: { $in: savedRelationships.map(r => r.entity) },
          language,
        },
        {},
        { withoutDocuments: true }
      )
    ).forEach(e => {
      relatedEntities[e.sharedId] = e;
    });

    return savedRelationships.map(r => ({ ...r, entityData: relatedEntities[r.entity] }));
  },

  async save(_relationships, language, updateEntities = true) {
    if (!language) {
      throw createError('Language cant be undefined');
    }

    const relationships = await this.prepareRelationshipsToSave(_relationships, language);

    if (relationships.length === 0) {
      return [];
    }

    const savedRelationships = await model.saveMultiple(
      relationships.map(r =>
        r._id
          ? {
              ...r,
              template: r.template && r.template._id !== null ? r.template : null,
            }
          : r
      )
    );

    const result = await this.appendRelatedEntityData(savedRelationships, language);

    if (updateEntities) {
      const touchedHubs = Array.from(new Set(relationships.map(r => r.hub)));
      for (let i = 0; i < touchedHubs.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await this.updateEntitiesMetadataByHub(touchedHubs[i], language);
      }
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

  async generateCreatedReferences(property, newValues, entity, existingReferences) {
    const { relationType: propertyRelationType } = property;
    const toCreate = newValues.filter(
      v =>
        !(existingReferences[propertyRelationType] && existingReferences[propertyRelationType][v])
    );

    let newReferencesBase = [];
    let newReferences = [];
    if (toCreate.length) {
      const candidateHub = await guessRelationshipPropertyHub(
        entity.sharedId,
        new ObjectId(propertyRelationType)
      );

      const hubId = (candidateHub[0] && candidateHub[0]._id) || new ObjectId();
      newReferencesBase = candidateHub[0] ? [] : [{ entity: entity.sharedId, hub: hubId }];

      newReferences = toCreate.map(value => ({
        entity: value,
        hub: hubId,
        template: propertyRelationType,
      }));
    }

    return { newReferencesBase, newReferences };
  },

  async separateCreatedDeletedReferences(property, entity, existingReferences) {
    const newValues = determinePropertyValues(entity, property.name);
    const newValueSet = new Set(newValues);

    const { relationType: propertyRelationType, content: propertyEntityType } = property;

    const { newReferencesBase, newReferences } = await this.generateCreatedReferences(
      property,
      newValues,
      entity,
      existingReferences
    );

    const toDelete = Object.entries(existingReferences[propertyRelationType] || {})
      .map(entry => entry[1])
      .filter(
        r =>
          r.rightSide.entity !== entity.sharedId &&
          (!propertyEntityType ||
            r.rightSide.entityData[0].template.toString() === propertyEntityType) &&
          !newValueSet.has(r.rightSide.entity)
      )
      .map(r => r.rightSide._id);

    return { newReferencesBase, newReferences, toDelete };
  },

  async prepareSaveEntityBasedReferences(entity, language, _template) {
    if (!language) throw createError('Language cant be undefined');
    if (!entity.template) return { relationshipProperties: [], existingReferences: {} };

    const template = _template || (await templatesAPI.getById(entity.template));
    const relationshipProperties = getPropertiesToBeConnections(template);

    if (!relationshipProperties.length) {
      return { relationshipProperties, existingReferences: {} };
    }

    const existingReferences = await getEntityReferencesByRelationshipTypes(
      entity.sharedId,
      relationshipProperties.map(p => p.relationType)
    );

    return { relationshipProperties, existingReferences };
  },

  async saveEntityBasedReferences(entity, language, _template) {
    const { relationshipProperties, existingReferences } =
      await this.prepareSaveEntityBasedReferences(entity, language, _template);

    const relationshipsToCreate = [];
    const relationshipsToDelete = [];

    for (let i = 0; i < relationshipProperties.length; i += 1) {
      const { newReferencesBase, newReferences, toDelete } =
        // eslint-disable-next-line no-await-in-loop
        await this.separateCreatedDeletedReferences(
          relationshipProperties[i],
          entity,
          existingReferences
        );
      relationshipsToCreate.push(...newReferencesBase, ...newReferences);
      relationshipsToDelete.push(...toDelete);
    }

    if (relationshipsToCreate.length) await this.save(relationshipsToCreate, language, false);
    if (relationshipsToDelete.length) {
      await this.delete(
        {
          _id: { $in: relationshipsToDelete },
        },
        language,
        false
      );
    }
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
    template.properties = await generateNames(template.properties);
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

  async swapTextReferencesFile(originalFileId, targetFileId) {
    return model.updateMany({ file: originalFileId }, { $set: { file: targetFileId } });
  },
};
