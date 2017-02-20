import mongoose from 'mongoose';
import couchStream from './couchStream.js';
import templates from '../app/api/templates';
import thesauris from '../app/api/thesauris/thesauris';
import entities from '../app/api/entities/entitiesModel';
import relationtypes from '../app/api/relationtypes/relationtypes';
import translations from '../app/api/i18n/translations';
import pages from '../app/api/pages/pages';
import references from '../app/api/references/connectionsModel';
import settings from '../app/api/settings/settingsModel.js';
import users from '../app/api/users/usersModel.js';
//import db from '../app/api/thesauris/thesauris';
//import {db} from '../app/api/utils';

let idMapping = {};

function migrateTemplate(template) {
  let oldId = template._id;
  delete template._id;
  delete template._rev;
  return templates.save(template)
  .then((created) => {
    idMapping[oldId] = created._id;
  })
  .catch((e) => {
    console.error(e);
  });
}

function migrateUsers(user) {
  let oldId = user._id;
  delete user._id;
  delete user._rev;
  return users.save(user)
  .then((created) => {
    idMapping[oldId] = created._id;
  })
  .catch((e) => {
    console.error(e);
  });
}

function migrateSettings(setting) {
  let oldId = setting._id;
  delete setting._id;
  delete setting._rev;
  return settings.save(setting)
  .then((created) => {
    idMapping[oldId] = created._id;
  })
  .catch((e) => {
    console.error(e);
  });
}

function migrateThesauri(thesauri) {
  let oldId = thesauri._id;
  delete thesauri._id;
  delete thesauri._rev;
  return thesauris.save(thesauri)
  .then((created) => {
    idMapping[oldId] = created._id;
  })
  .catch((e) => console.error(e));
}

function migrateConnections(connection) {
  let oldId = connection._id;
  delete connection._id;
  delete connection._rev;
  if (connection.relationType) {
    connection.relationType = idMapping[connection.relationType];
  }
  return references.save(connection)
  .then((created) => {
    idMapping[oldId] = created._id;
  })
  .catch((e) => console.error(e));
}

function migrateRelationType(relationType) {
  let oldId = relationType._id;
  delete relationType._id;
  delete relationType._rev;
  return relationtypes.save(relationType)
  .then((created) => {
    idMapping[oldId] = created._id;
  })
  .catch((e) => console.error(e));
}

function migratePage(page) {
  let oldId = page._id;
  delete page._id;
  delete page._rev;
  return pages.save(page)
  .then((created) => {
    idMapping[oldId] = created._id;
  })
  .catch((e) => console.error(e));
}

function migrateEntity(entity) {
  let oldId = entity._id;
  delete entity._id;
  //delete entity.user._id;
  entity.toc = entity.toc || [];
  entity.toc.forEach((tocElement) => {
    delete tocElement._id;
  });

  delete entity._rev;
  entity.template = idMapping[entity.template];
  return entities.save(entity)
  .then((created) => {
    idMapping[oldId] = created._id;
  })
  .catch((e) => console.error(e));
}

function migrateTranslation(translation) {
  let oldId = translation._id;
  delete translation._id;
  delete translation._rev;
  translation.contexts.forEach((context) => {
    if (context.id !== 'System' && context.id !== 'Menu' && context.id !== 'Filters') {
      context.id = idMapping[context.id];
    }
    Object.keys(context.values).forEach((key) => {
      if (key.match(/\./)) {
        context.values[key.replace(/\./, '')] = context.values[key];
        delete context.values[key];
      }
    });
  });
  return translations.save(translation)
  .then((created) => {
    idMapping[oldId] = created._id;
  })
  .catch((e) => console.error(e));
}

couchStream('_design/templates/_view/all', migrateTemplate)
.then(() => couchStream('_design/thesauris/_view/dictionaries', migrateThesauri))
.then(() => couchStream('_design/users/_view/all', migrateUsers))
.then(() => couchStream('_design/settings/_view/all', migrateSettings))
.then(() => couchStream('_design/relationtypes/_view/all', migrateRelationType))
.then(() => couchStream('_design/translations/_view/all', migrateTranslation))
.then(() => couchStream('_design/pages/_view/all', migratePage))
.then(() => couchStream('/_design/entities_and_docs/_view/sharedId', migrateEntity))
.then(() => couchStream('_design/references/_view/all', migrateConnections))
.then(() => {
  return templates.get()
  .then((allTemplates) => {
    let promises = [];
    allTemplates.forEach((template) => {
      template.properties.forEach((prop) => {
        if (prop.content) {
          prop.content = idMapping[prop.content];
        }
      });
      promises.push(templates.save(template));
    });
    return Promise.all(promises);
  });
})
.then(() => mongoose.disconnect());
