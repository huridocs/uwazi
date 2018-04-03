import P from 'bluebird';
import mongoose from 'mongoose';

import dbConfig from '../app/api/config/database';
import indexConfig from '../app/api/config/elasticIndexes';

import templatesModel from '../app/api/templates/templates';
import dictionariesModel from '../app/api/thesauris/dictionariesModel';
import entitiesModel from '../app/api/entities/entitiesModel';

let fix = false;
if (process.argv.includes('--fix')) {
  fix = true;
}

const entitiesNeedToBeFixed = [];
let entitiesProcessed = 0;
let totalEntities = 0;
let fixed = 0;

let dictionaries;
let templates;

function getDicionaries() {
  return dictionariesModel.get()
  .then((_dictionaries) => {
    dictionaries = _dictionaries;
  });
}

function getTemplates() {
  return templatesModel.get()
  .then((_templates) => {
    templates = _templates.reduce((response, template) => {
      response[template._id] = template;
      return response;
    }, {});
  });
}

function logProcess(type, processed, length) {
  process.stdout.write(`${type} processed: ${processed} of ${length}\r`);
}

function entityExists(sharedId) {
  return entitiesModel.get({ sharedId }, { _id: 1 })
  .then(results => results.length);
}

function dictionaryEntryExists(id) {
  const found = dictionaries.find(dictionary => dictionary.values.find(enrty => enrty.id.toString() === id));
  return Promise.resolve(found);
}

function processForeignIdProperty(property, entity, checkFunction) {
  const unExistant = [];
  let action = Promise.resolve();
  if (property.type === 'select') {
    action = checkFunction(entity.metadata[property.name])
    .then((exists) => {
      if (!exists) {
        unExistant.push(entity.metadata[property.name]);
      }
    });
  } else {
    action = Promise.all(entity.metadata[property.name].map(sharedId => checkFunction(sharedId)
    .then((exists) => {
      if (!exists) {
        unExistant.push(sharedId);
      }
    })));
  }

  return action
  .then(() => {
    if (unExistant.length) {
      //intentionaly modifying by reference
      if (property.type === 'select') {
        delete entity.metadata[property.name]; //eslint-disable-line
        return Promise.reject();
      }
      entity.metadata[property.name] = entity.metadata[property.name].filter(sharedId => !unExistant.includes(sharedId));  //eslint-disable-line
      return Promise.reject();
    }

    return Promise.resolve();
  });
}

function processProperty(property, entity) {
  if (property.type === 'relationship' && entity.metadata[property.name]) {
    return processForeignIdProperty(property, entity, entityExists);
  }

  if ((property.type === 'select' || property.type === 'multiselect') && entity.metadata[property.name]) {
    return processForeignIdProperty(property, entity, dictionaryEntryExists);
  }

  return Promise.resolve();
}

function processEntity(entity) {
  if (!entity.template) {
    return Promise.resolve();
  }
  const template = templates[entity.template];
  let needToFix = false;
  return Promise.all(template.properties.map(property => processProperty(property, entity)
  .catch(() => {
    needToFix = true;
  })))
  .then(() => {
    if (needToFix) {
      entitiesNeedToBeFixed.push(entity);
    }

    if (fix && needToFix) {
      fixed += 1;
      return entitiesModel.save(entity);
    }

    return Promise.resolve();
  });
}

function processEntities() {
  return entitiesModel.get({}, { _id: 1 })
  .then((_entities) => {
    totalEntities = _entities.length;
    return P.resolve(_entities).map(({ _id }) => entitiesModel.getById(_id)
    .then(entity => processEntity(entity)
    .then(() => {
      entitiesProcessed += 1;
      logProcess('Entities', entitiesProcessed, totalEntities);
    })), { concurrency: 10 });
  });
}


indexConfig.index = indexConfig.development;
mongoose.Promise = Promise;
mongoose.connect(dbConfig.development, { useMongoClient: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:')); //eslint-disable-line
db.once('open', () => {
  getTemplates()
  .then(getDicionaries)
  .then(processEntities)
  .then(() => {
    process.stdout.write(`Entities processed: ${entitiesProcessed} of ${totalEntities}\n`);
    process.stdout.write(`Entities with errors: ${entitiesNeedToBeFixed.length}\n`);
    process.stdout.write(`Entities fixed: ${fixed}\n`);
    process.exit(0);
  })
  .catch(console.log); //eslint-disable-line
});
