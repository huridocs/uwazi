import mongoose from 'mongoose';
import couchStream from './couchStream.js';
import templates from '../app/api/templates';
import thesauris from '../app/api/thesauris/thesauris';

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

function migrateThesauri(thesauri) {
  let oldId = thesauri._id;
  delete thesauri._id;
  delete thesauri._rev;
  return thesauris.save(thesauri)
  .then((created) => {
    idMapping[oldId] = created._id;
  })
  .catch((e) => {
    console.error(e);
  });
}

//function migrateEntity(entity) {
  //let oldId = entity._id;
  //delete entity._id;
  //delete entity._rev;
  //entity.template = idMapping[entity.template];
  //return Entities.create(entity)
  //.then((created) => {
    //idMapping[oldId] = created._id;
  //});
//}

couchStream('_design/templates/_view/all', migrateTemplate)
.then(() => couchStream('_design/thesauris/_view/dictionaries', migrateThesauri))
//.then(() => couchStream('/_design/entities_and_docs/_view/sharedId', migrateEntity))
.then(() => mongoose.disconnect());
