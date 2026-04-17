import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { default: true, key: 'en', label: 'English' },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],

  dictionaries: [
    factory.thesauri('colors', [
      ['red_id', 'Red'],
      ['blue_id', 'Blue'],
      ['green_id', 'Green'],
    ]),
  ],

  templates: [
    factory.template('Full Template', [
      factory.property('text', 'text'),
      factory.property('numeric', 'numeric'),
      factory.property('multiselect', 'multiselect', {
        content: factory.id('colors').toHexString(),
      }),
    ]),

    factory.template('Basic Template', []),

    factory.template('Other Template', [factory.property('other_text', 'text')]),
  ],

  entities: [
    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'entity-1',
      'Full Template',
      {},
      {
        icon: { _id: 'icon-original-1', type: 'image', label: 'Original Icon 1' },
        published: false,
        obsoleteMetadata: [],
      },
      {
        en: {
          title: 'Entity 1 EN title',
          metadata: {
            text: [{ value: 'Entity 1 EN text' }],
            numeric: [{ value: 10 }],
            multiselect: [{ value: 'red_id', label: 'Red' }],
          },
        },
        es: {
          title: 'Entity 1 ES title',
          metadata: {
            text: [{ value: 'Entity 1 ES text' }],
            numeric: [{ value: 10 }],
            multiselect: [{ value: 'red_id', label: 'Red' }],
          },
        },
      }
    ),

    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'entity-2',
      'Full Template',
      {
        text: [{ value: 'Entity 2 original text' }],
        numeric: [{ value: 20 }],
        multiselect: [{ value: 'blue_id', label: 'Blue' }],
      },
      {
        title: 'Entity 2 original title',
        icon: { _id: 'icon-original-2', type: 'image', label: 'Original Icon 2' },
        published: false,
        obsoleteMetadata: [],
      }
    ),

    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'entity-basic',
      'Basic Template',
      {},
      {
        title: 'Entity Basic original title',
        published: false,
        obsoleteMetadata: [],
      }
    ),

    // Starts on Other Template — used to test per-entity template change detection
    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'entity-other',
      'Other Template',
      { other_text: [{ value: 'Entity Other original other_text' }] },
      {
        title: 'Entity Other original title',
        published: false,
        obsoleteMetadata: [],
      }
    ),
  ],
};

const permissionsFixtures: DBFixture = {
  settings: fixtures.settings,
  templates: [factory.template('Document')],
  entities: [
    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'entity_write',
      'Document',
      {},
      {
        title: 'Entity Write',
        obsoleteMetadata: [],
        permissions: [factory.entityPermission('collaborator', 'user', 'write')],
      }
    ),
    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'entity_read',
      'Document',
      {},
      {
        title: 'Entity Read',
        obsoleteMetadata: [],
        permissions: [factory.entityPermission('collaborator', 'user', 'read')],
      }
    ),
    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'entity_group_write',
      'Document',
      {},
      {
        title: 'Entity Group Write',
        obsoleteMetadata: [],
        permissions: [factory.entityPermission('group1', 'group', 'write')],
      }
    ),
    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'entity_no_perm',
      'Document',
      {},
      {
        title: 'Entity No Perm',
        obsoleteMetadata: [],
        permissions: [factory.entityPermission('editor', 'user', 'write')],
      }
    ),
  ],
};

export { fixtures, permissionsFixtures, factory };
