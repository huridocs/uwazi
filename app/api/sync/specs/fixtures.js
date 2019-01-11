/* eslint-disable max-len */
import db from 'api/utils/testing_db';

const oldDoc1 = db.id();
const oldDoc2 = db.id();
const newDoc1 = db.id();
const newDoc2 = db.id();
const newDoc3 = db.id();
const newDoc4 = db.id();
const newDoc5 = db.id();
const newDoc6 = db.id();

const template1 = db.id();

const template1Property1 = db.id();
const template1Property2 = db.id();
const template1Property3 = db.id();

const template2 = db.id();
const template3 = db.id();

const settingsId = db.id();
const sessionsId = db.id();

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
      namespace: 'entities',
      mongoId: newDoc6,
      deleted: false,
    },
    {
      timestamp: 9000,
      namespace: 'templates',
      mongoId: template1,
      deleted: false,
    },
    {
      timestamp: 9000,
      namespace: 'templates',
      mongoId: template2,
      deleted: false,
    },
    {
      timestamp: 9000,
      namespace: 'templates',
      mongoId: template3,
      deleted: false,
    },
    {
      timestamp: 9000,
      namespace: 'migrations',
      mongoId: newDoc1,
      deleted: false,
    },
    {
      timestamp: 9001,
      namespace: 'settings',
      mongoId: settingsId,
      deleted: false,
    },
    {
      timestamp: 9002,
      namespace: 'sessions',
      mongoId: sessionsId,
      deleted: false,
    },
  ],

  entities: [
    {
      _id: newDoc1,
      title: 'a new entity',
      template: template1,
      metadata: {
        t1Property1: 'sync property 1',
        t1Property2: 'sync property 2',
        t1Property3: 'sync property 3',
      }
    },
    {
      _id: newDoc2,
      title: 'another new entity',
      template: template1,
      metadata: {
        t1Property1: 'another doc property 1',
        t1Property2: 'another doc property 2',
      }
    },
    {
      _id: newDoc6,
      title: 'not to sync',
      template: template3,
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

  templates: [
    {
      _id: template1,
      properties: [
        {
          _id: template1Property1,
          name: 't1Property1',
        },
        {
          _id: template1Property2,
          name: 't1Property2',
        },
        {
          _id: template1Property3,
          name: 't1Property3',
        },
      ],
    },
    {
      _id: template2
    },
    {
      _id: template3
    }
  ],

  settings: [
    {
      _id: settingsId,
      languages: [{ key: 'es', default: true }],
      sync: {
        url: 'url',
        active: true,
        config: {}
      }
    },
  ],

  sessions: [
    { _id: sessionsId }
  ]
};

export {
  newDoc1,
  newDoc2,
  newDoc3,
  newDoc4,
  template1,
  template1Property1,
  template1Property2,
  template1Property3,
  template2,
  template3
};
