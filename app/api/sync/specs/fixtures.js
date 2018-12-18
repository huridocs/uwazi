/* eslint-disable max-len */
import db from 'api/utils/testing_db';

const oldDoc1 = db.id();
const oldDoc2 = db.id();
const newDoc1 = db.id();
const newDoc2 = db.id();
const newDoc3 = db.id();
const newDoc4 = db.id();

export default {
  sync: [
    {
      lastSync: 10000,
    },
  ],
  updateLogs: [
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
      timestamp: 10000,
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
      timestamp: 20000,
      namespace: 'connections',
      mongoId: newDoc3,
      deleted: false,
    },
    {
      timestamp: 20000,
      namespace: 'entities',
      mongoId: newDoc4,
      deleted: true,
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
  ],
};

export { newDoc1, newDoc2, newDoc3, newDoc4 };
