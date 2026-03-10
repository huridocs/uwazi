import db from 'api/utils/testing_db';

const settings = db.id();
const [template1, template2, entity1, entity2, entity3] = [
  db.id(),
  db.id(),
  db.id(),
  db.id(),
  db.id(),
];
const [connection1, thesauri1, translation1, relationtype1, migration1] = [
  db.id(),
  db.id(),
  db.id(),
  db.id(),
  db.id(),
];

export default {
  settings: [{ _id: settings, prop: 'prop' }],

  templates: [{ _id: template1 }, { _id: template2 }],

  entities: [{ _id: entity1 }, { _id: entity2 }, { _id: entity3 }],

  connections: [{ _id: connection1 }],

  dictionaries: [{ _id: thesauri1 }],

  translations: [{ _id: translation1 }],

  relationtypes: [{ _id: relationtype1 }],

  migrations: [{ _id: migration1 }],

  updatelogs: [
    { mongoId: template1, previous: 'previous log 1' },
    { mongoId: connection1, previous: 'previous log 2' },
  ],
};

export { template1, template2, entity1, entity3, translation1, connection1, migration1 };
