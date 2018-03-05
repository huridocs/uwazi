import P from 'bluebird';

import relationshipsModel from '../relationships/model';
import settings from '../settings/settings';
import relationships from '../relationships/relationships';
import templatesModel from '../templates/templates';
import relationtypes from '../relationtypes/relationtypes';
import entities from '../entities/entities';
import entitiesmodel from '../entities/entitiesModel';
import mongoose from 'mongoose';
import {generateID} from 'api/odm';

const connectionsRelationTypes = {};

function createRelationType(property) {
  return relationtypes.get({name: property.label})
  .then((result) => {
    if (!result.length) {
      console.log('Creating relation type:', property.label);
      return relationtypes.save({name: property.label})
      .then((newRelationType) => {
        connectionsRelationTypes[property.name] = newRelationType._id;
        return newRelationType._id;
      });
    }

    connectionsRelationTypes[property.name] = result[0]._id;
    return result[0]._id;
  }).catch((e) => {
    console.log('Saving relation type error:', e);
  });
}

function migrateTemplates() {
  return templatesModel.get()
  .then((_templates) => {
    return P.resolve(_templates).map((template) => {
      console.log('Migrating template:', template.name);
      return P.resolve(template.properties.map((property) => {
        if (property.type === 'select' || property.type === 'multiselect') {
          return templatesModel.get({_id: property.content})
          .then((result) => {
            if (result.length) {
              return createRelationType(property)
              .then((relationTypeId) => {
                property.type = 'relationship';
                property.relationType = relationTypeId;
              }).catch(console.log);
            }
            return Promise.resolve();
          });
        }
        return Promise.resolve();
      }), {concurrency: 1})
      .then(() => templatesModel.save(template)).catch(console.log);
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
            relationships.save(relationsHub, language)
          ]);
        });
      }

      return Promise.all([
        relationshipsModel.delete(relationship),
        relationships.save({entity: relationship.sourceDocument, hub, template: null}, language),
        relationships.save({entity: relationship.targetDocument, hub, template: relationship.relationType}, language)
      ]);
    }, {concurrency: 1});
  });
}

let entitiesProcessed = 0;
let totalEntities;

function migrateEntities() {
  process.stdout.write(`Relations processed: ${relationsProcessed} of ${relationsProcessed}\r\n`);
  return Promise.all([entities.get({}, {_id: 1}), templatesModel.get()])
  .then(([_entities, _templates]) => {
    totalEntities = _entities.length;
    let keyTemplates = _templates.reduce((response, template) => {
      response[template._id] = template;
      return response;
    }, {});
    return P.resolve(_entities).map(({_id}) => {
      return entities.getById(_id)
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
        return entitiesmodel.save(entity);
      });
    }, {concurrency: 10});
  });
}

const start = Date.now();
migrateTemplates()
.then(migrateRelationships)
.then(migrateEntities)
.then(() => {
  const end = Date.now();
  process.stdout.write(`Entities processed: ${entitiesProcessed} of ${totalEntities}\r\n`);
  process.stdout.write(`Done, took ${(end - start) / 1000} seconds\n`);
  mongoose.disconnect();
})
.catch(console.log);
