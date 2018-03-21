import P from 'bluebird';

import relationshipsModel from '../relationships/model';
import settings from '../settings/settings';
import relationships from '../relationships/relationships';
import templatesModel from '../templates/templates';
import relationtypes from '../relationtypes/relationtypes';
import entitiesModel from '../entities/entitiesModel';
import mongoose from 'mongoose';
import {generateID} from 'api/odm';
import entities from '../entities/entities';

entities.save = () => {
  return Promise.resolve();
};

function logProcess(processed, length, deleted) {
  process.stdout.write(`Relations pre-processed: ${processed} of ${length}.  Deleted: ${deleted} \r`);
}

function sanitizeExistingData() {
  console.log('Sanitizing current DB:');
  let processedRelationships = 0;
  let deletedRelationships = 0;

  return relationshipsModel.get()
  .then(relations => {
    return P.resolve(relations).map(relationship => {
      processedRelationships += 1;
      if (!relationship.sourceDocument) { // Avoid issues if instance already migrated.
        logProcess(processedRelationships, relations.length, deletedRelationships);
        return Promise.resolve();
      }

      return Promise.all([
        entitiesModel.get({sharedId: relationship.sourceDocument}, {_id: 1}),
        entitiesModel.get({sharedId: relationship.targetDocument}, {_id: 1})
      ])
      .then(([sourceEntities, targetEntities]) => {
        if (!sourceEntities.length || !targetEntities.length) {
          deletedRelationships += 1;
          logProcess(processedRelationships, relations.length, deletedRelationships);
          return relationshipsModel.delete(relationship);
        }

        logProcess(processedRelationships, relations.length, deletedRelationships);
        return Promise.resolve();
      });
    }, {concurrency: 1});
  })
  .then(() => console.log(''))
  .catch(console.log);
}

const connectionsRelationTypes = {};

function createRelationTypesWhenNotExists(properties) {
  return Promise.all(properties.map((property) => {
    if (property.type !== 'select' && property.type !== 'multiselect') {
      return Promise.resolve();
    }
    return relationtypes.get({name: property.label})
    .then((result) => {
      if (!result.length) {
        console.log('Creating relation type:', property.label);
        return relationtypes.save({name: property.label})
        .then((newRelationType) => {
          connectionsRelationTypes[property.name] = newRelationType._id;
        });
      }
      connectionsRelationTypes[property.name] = result[0]._id;
    });
  })).catch(console.log);
}

function migrateTemplates() {
  return templatesModel.get()
  .then((_templates) => {
    return P.resolve(_templates).map((template) => {
      return createRelationTypesWhenNotExists(template.properties)
      .then(() => {
        console.log('Migrating template:', template.name);
        template.properties = template.properties.map((property) => {
          if (property.type === 'select' || property.type === 'multiselect') {
            const contentIsTemplate = !!_templates.find((t) => t._id.toString() === property.content);
            if (contentIsTemplate) {
                property.type = 'relationship';
                property.relationType = connectionsRelationTypes[property.name];
            }
          }
          return property;
        });
        return Promise.resolve(template);
      })
      .then((templateToSave) => {
        return templatesModel.save(templateToSave);
      }).catch(console.log);
    }, {concurrency: 1}).catch(console.log);
  });
}

let relationsProcessed = 0;
let totalRelations;
let relationsProcessedInAdifferentHub = [];

function migrateRelationships() {
  return Promise.all([relationshipsModel.get(), settings.get()])
  .then(([relations, _settings]) => {
    const defaultLanguage = _settings.languages.find((lang) => lang.default) || settings.languages[0];
    const language = defaultLanguage.key;
    totalRelations = relations.length;
    return P.resolve(relations).map((relationship) => {
      if (!relationship.sourceDocument) {
        console.error('THIS INSTANCE HAS BEEN ALREADY MIGRATED');
        return Promise.resolve();
      }
      relationsProcessed += 1;
      process.stdout.write(`Relations processed: ${relationsProcessed} of ${totalRelations}\r`);
      if (relationsProcessedInAdifferentHub.includes(relationship._id.toString())) {
        return relationshipsModel.delete(relationship);
      }

      const hub = generateID();
      if (relationship.sourceType === 'metadata') {
        return templatesModel.get({_id: relationship.sourceTemplate})
        .then(([template]) => {
          const property = template.properties.find((prop) => prop.name === relationship.sourceProperty);
          return relationtypes.get({name: {$regex: `^${property.label}$`, $options: 'i'}});
        })
        .then(([relationType]) => {
          return Promise.all([Promise.resolve(relationType), relationshipsModel.get({
            sourceDocument: relationship.sourceDocument,
            sourceType: 'metadata',
            sourceProperty: relationship.sourceProperty
          })]);
        }).then(([relationType, relationshipsOfTheSameHub]) => {
          let relationsHub = [
            {entity: relationship.sourceDocument, hub, template: null}
          ];
          relationshipsOfTheSameHub.forEach((relation) => {
            relationsProcessedInAdifferentHub.push(relation._id.toString());
            relationsHub.push({entity: relation.targetDocument, hub, template: relationType._id});
          });
          return Promise.all([
            relationshipsModel.delete(relationship),
            relationships.save(relationsHub, language, false)
          ]);
        });
      }

      return Promise.all([
        relationshipsModel.delete(relationship),
        relationships.save({entity: relationship.sourceDocument, hub, template: null}, language, false),
        relationships.save({entity: relationship.targetDocument, hub, template: relationship.relationType}, language, false)
      ]);
    }, {concurrency: 1});
  });
}

let entitiesProcessed = 0;
let totalEntities;

function migrateEntities() {
  process.stdout.write(`Relations processed: ${relationsProcessed} of ${relationsProcessed}\r\n`);
  return Promise.all([entitiesModel.get({}, {_id: 1}), templatesModel.get()])
  .then(([_entities, _templates]) => {
    totalEntities = _entities.length;
    let keyTemplates = _templates.reduce((response, template) => {
      response[template._id] = template;
      return response;
    }, {});
    return P.resolve(_entities).map(({_id}) => {
      return entitiesModel.getById(_id)
      .then((entity) => {
        if (!entity.template) {
          entitiesProcessed += 1;
          process.stdout.write(`Entities processed: ${entitiesProcessed} of ${totalEntities}\r`);
          return Promise.resolve();
        }
        let template = keyTemplates[entity.template];
        template.properties.forEach((property) => {
          if (property.type === 'relationship' && entity.metadata[property.name] && typeof entity.metadata[property.name] === 'string') {
            entity.metadata[property.name] = [entity.metadata[property.name]];
          }
        });
        entitiesProcessed += 1;
        process.stdout.write(`Entities processed: ${entitiesProcessed} of ${totalEntities}\r`);
        return entitiesModel.save(entity);
      });
    }, {concurrency: 10});
  });
}

const start = Date.now();
sanitizeExistingData()
.then(migrateTemplates)
.then(migrateRelationships)
.then(migrateEntities)
.then(() => {
  const end = Date.now();
  process.stdout.write(`Entities processed: ${entitiesProcessed} of ${totalEntities}\r\n`);
  process.stdout.write(`Done, took ${(end - start) / 1000} seconds\n`);
  mongoose.disconnect();
})
.catch(console.log);
