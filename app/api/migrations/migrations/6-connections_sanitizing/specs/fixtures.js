import db from 'api/utils/testing_db';

const hub1 = db.id().toString();
const hub2 = db.id().toString();
const hub3 = db.id().toString();

const template1 = db.id().toString();
const template2 = db.id().toString();

const shared1 = db.id().toString();
const shared2 = db.id().toString();
const shared3 = db.id().toString();
const shared4 = db.id().toString();
const shared5 = db.id().toString();
const shared6 = db.id().toString();
const shared7 = db.id().toString();

export default {
  settings: [
    {
      languages: [
        {
          key: 'es',
          label: 'Español',
          default: true,
        },
        {
          key: 'en',
          label: 'English',
        },
        {
          key: 'pt',
          label: 'Português',
        },
      ],
    },
  ],
  connections: [
    // Good connections
    {
      entity: 'connectedEntity1',
      hub: hub1,
      template: template1,
      language: 'pt',
      sharedId: shared1,
    },
    {
      entity: 'connectedEntity1',
      hub: hub1,
      template: template1,
      language: 'es',
      sharedId: shared1,
    },
    {
      entity: 'connectedEntity1',
      hub: hub1,
      template: template1,
      language: 'en',
      sharedId: shared1,
    },
    {
      entity: 'connectedEntity2',
      hub: hub1,
      template: template1,
      language: 'pt',
      sharedId: 'shared7',
    },
    {
      entity: 'connectedEntity2',
      hub: hub1,
      template: template1,
      language: 'es',
      sharedId: 'shared7',
    },
    {
      entity: 'connectedEntity2',
      hub: hub1,
      template: template1,
      language: 'en',
      sharedId: 'shared7',
    },
    // Incomplete connection
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
    // Residual connections
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
    // Text connections of only 2 docs (valid)
    {
      entity: 'textReferencedDocument',
      hub: hub2,
      template: template1,
      language: 'pt',
      sharedId: shared4,
      range: { text: 'some text' },
    },
    {
      entity: 'textReferencedDocument',
      hub: hub2,
      template: template1,
      language: 'en',
      sharedId: shared4,
      range: { text: 'some text' },
    },
    // Good connection
    {
      entity: 'connectedEntity3',
      hub: hub2,
      template: template1,
      language: 'pt',
      sharedId: shared5,
    },
    {
      entity: 'connectedEntity3',
      hub: hub2,
      template: template1,
      language: 'es',
      sharedId: shared5,
    },
    {
      entity: 'connectedEntity3',
      hub: hub2,
      template: template1,
      language: 'en',
      sharedId: shared5,
    },
    // Good connection of single-connection hub (after deletion)
    {
      entity: 'connectedEntity',
      hub: hub3,
      template: template1,
      language: 'pt',
      sharedId: shared6,
    },
    {
      entity: 'connectedEntity',
      hub: hub3,
      template: template1,
      language: 'es',
      sharedId: shared6,
    },
    {
      entity: 'connectedEntity',
      hub: hub3,
      template: template1,
      language: 'en',
      sharedId: shared6,
    },
    {
      entity: 'connectedEntity',
      hub: hub3,
      template: template1,
      language: 'en',
      sharedId: shared7,
    },
  ],
};

export { hub1, hub2, hub3, shared1, shared2, shared3, shared4, shared5, shared6 };
