import mongoose from 'mongoose';
import couchStream from './couchStream.js';
import templates from '../app/api/templates';

const entitySchema = new mongoose.Schema({
  title: String,
  template: {type: mongoose.Schema.Types.ObjectId, ref: 'templates'}
});

const Entities = mongoose.model('entities', entitySchema);

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

function migrateEntity(entity) {
  let oldId = entity._id;
  delete entity._id;
  delete entity._rev;
  entity.template = idMapping[entity.template];
  return Entities.create(entity)
  .then((created) => {
    idMapping[oldId] = created._id;
  });
}

couchStream('_design/templates/_view/all', migrateTemplate)
.then(() => couchStream('/_design/entities_and_docs/_view/sharedId', migrateEntity))
.then(() => mongoose.disconnect());
