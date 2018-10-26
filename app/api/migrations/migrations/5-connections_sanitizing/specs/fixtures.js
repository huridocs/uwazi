import db from 'api/utils/testing_db';

const hub1 = db.id().toString();
const template1 = db.id().toString();
const template2 = db.id().toString();
const shared1 = db.id().toString();
const shared2 = db.id().toString();
const shared3 = db.id().toString();

export default {
  settings: [{
    languages: [
      {
        key: 'es',
        label: 'Español',
        default: true
      },
      {
        key: 'en',
        label: 'English',
      },
      {
        key: 'pt',
        label: 'Português',
      }
    ]
  }],
  connections: [
    // Good connection
    {
      entity: 'connectedEntity',
      hub: hub1,
      template: template1,
      language: 'pt',
      sharedId: shared1,
    },
    {
      entity: 'connectedEntity',
      hub: hub1,
      template: template1,
      language: 'es',
      sharedId: shared1,
    },
    {
      entity: 'connectedEntity',
      hub: hub1,
      template: template1,
      language: 'en',
      sharedId: shared1,
    },
    // Incomplete connection 1
    {
      entity: 'anotherEntity',
      hub: hub1,
      template: template2,
      language: 'es',
      sharedId: shared2,
    },
    {
      entity: 'anotherEntity',
      hub: hub1,
      template: template2,
      language: 'en',
      sharedId: shared2,
    },
    // Residual connections 1
    {
      entity: 'someDocument',
      hub: hub1,
      template: template1,
      language: 'pt',
      sharedId: shared3,
    },
    {
      entity: 'someDocument',
      hub: hub1,
      template: template1,
      language: 'en',
      sharedId: shared3,
    },
  ],
};
