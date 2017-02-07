import mongoose from 'mongoose';
import couchStream from './couchStream.js';
mongoose.Promise = Promise;
mongoose.createConnection('mongodb://localhost/uwazi_development');

const propertiesSchema = new mongoose.Schema({
  id: String,
  label: String,
  type: String,
  content: String,
  name: String,
  filter: Boolean,
  sortable: Boolean,
  showInCard: Boolean
});

const templateSchema = new mongoose.Schema({
  name: String,
  properties: [propertiesSchema]
});

const Templates = mongoose.model('templates', templateSchema);

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
  return Templates.create(template)
  .then((created) => {
    idMapping[oldId] = created._id;
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

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  mongoose.connection.db.dropDatabase(() => {
    couchStream('_design/templates/_view/all', migrateTemplate)
    .then(() => couchStream('/_design/entities_and_docs/_view/sharedId', migrateEntity))
    .then(() => {
      mongoose.disconnect();
    });
  })
});
