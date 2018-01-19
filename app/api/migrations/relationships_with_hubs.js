import P from 'bluebird';

import relationShipsmodel from '../references/connectionsModel';
import templatesModel from '../templates/templates';
import relationtypes from '../relationtypes/relationtypes';
import entitiesModel from '../entities/entitiesModel';
import mongoose from 'mongoose';
import {generateID} from 'api/odm';

const connectionsRelationTypes = {};

function createRelationType(property) {
  return relationtypes.get({name: property.label})
  .then((result) => {
    if (!result.length) {
      console.log('Creating relation type:', property.label)
      return relationtypes.save({name: property.label})
      .then((newRelationType) => {
        connectionsRelationTypes[property.name] = newRelationType._id;
        return newRelationType._id;
      });
    }

    connectionsRelationTypes[property.name] = result[0]._id;
    return result[0]._id;
  }).catch(console.log);
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

function migrateRelationships() {
  return relationShipsmodel.get()
  .then((relations) => {
    totalRelations = relations.length;
    return P.resolve(relations).map((relationship) => {
      if (!relationship.sourceDocument) {
        console.error('THIS INSTANCE HAS BEEN ALREADY MIGRATED');
        return Promise.resolve();
      }
      relationsProcessed += 1;
      process.stdout.write(`Relations processed: ${relationsProcessed} of ${totalRelations}\r`);
      const hub = generateID();
      if (relationship.sourceType === 'metadata') {
        return templatesModel.get({_id: relationship.sourceTemplate})
        .then(([template]) => {
          const property = template.properties.find((prop) => prop.name === relationship.sourceProperty);
          return relationtypes.get({name: property.label});
        })
        .then(([relationType]) => {
          return Promise.all([
            relationShipsmodel.delete(relationship),
            relationShipsmodel.save({entity: relationship.sourceDocument, hub, template: null}),
            relationShipsmodel.save({entity: relationship.targetDocument, hub, template: relationType._id})
          ]);
        });
      }

      return Promise.all([
        relationShipsmodel.delete(relationship),
        relationShipsmodel.save({entity: relationship.sourceDocument, hub, template: null}),
        relationShipsmodel.save({entity: relationship.targetDocument, hub, template: relationship.relationType})
      ]);
    }, {concurrency: 1});
  });
}

migrateTemplates().then(migrateRelationships)
.then(() => {
  console.log('done');
  mongoose.disconnect();
})
.catch(console.log);
