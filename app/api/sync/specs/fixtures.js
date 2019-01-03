/* eslint-disable max-len */
import db from 'api/utils/testing_db';

const oldDoc1 = db.id();
const oldDoc2 = db.id();
const newDoc1 = db.id();
const newDoc2 = db.id();
const newDoc3 = db.id();
const newDoc4 = db.id();
const newDoc5 = db.id();

export default {
  syncs: [
    {
      lastSync: 10000,
    },
  ],
  updatelogs: [
    {
      timestamp: 20000,
      namespace: 'entities',
      mongoId: newDoc4,
      deleted: true,
    },
    {
      timestamp: 22000,
      namespace: 'connections',
      mongoId: newDoc5,
      deleted: false,
    },
    {
      timestamp: 20000,
      namespace: 'connections',
      mongoId: newDoc3,
      deleted: false,
    },
    {
      timestamp: 6000,
      namespace: 'entities',
      mongoId: oldDoc1,
      deleted: false,
    },
    {
      timestamp: 7000,
      namespace: 'entities',
      mongoId: oldDoc2,
      deleted: false,
    },
    {
      timestamp: 12000,
      namespace: 'entities',
      mongoId: newDoc2,
      deleted: false,
    },
    {
      timestamp: 9000,
      namespace: 'entities',
      mongoId: newDoc1,
      deleted: false,
    },
    {
      timestamp: 9000,
      namespace: 'migrations',
      mongoId: newDoc1,
      deleted: false,
    },
  ],
  entities: [
    {
      _id: newDoc1,
      title: 'a new entity',
    },
    {
      _id: newDoc2,
      title: 'another new entity',
    },
  ],
  connections: [
    {
      _id: newDoc3,
      entity: newDoc1,
    },
    {
      _id: newDoc5,
      entity: newDoc1,
    },
  ],
  settings: [
    {
      languages: [{ key: 'es', default: true }],
      sync: {
        url: 'url',
        active: true,
      }
    },
  ],
};

export { newDoc1, newDoc2, newDoc3, newDoc4 };
