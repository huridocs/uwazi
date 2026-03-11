import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import db, { DBFixture } from '#api/utils/testing_db.js';
import { AccessLevels, PermissionType } from '#shared/types/permissionSchema.js';
import { UserRole } from '#shared/types/userSchema.js';

const fixtureFactory = getFixturesFactory();

// Template IDs
const templateId = fixtureFactory.id('template_test');
const templateForGetWithRelationships = fixtureFactory.id('templateForGetWithRelationships');

// User IDs
const adminId = fixtureFactory.id('admin');
const user1Id = fixtureFactory.id('user1');
const user2Id = fixtureFactory.id('user2');

// Entity IDs - using fixtureFactory.id for stable references
const batmanFinishesId = fixtureFactory.id('shared-en');
const docId1 = fixtureFactory.id('shared-es');
const docId2 = fixtureFactory.id('shared-pt');
const shared2Id = fixtureFactory.id('shared2-en');
const unpublishedDocId = fixtureFactory.id('other-en');

// File IDs
const uploadId1 = fixtureFactory.id('upload1');
const uploadId2 = fixtureFactory.id('upload2');

// Relation type IDs
const relationType1 = fixtureFactory.id('relationType1');
const relationType4 = fixtureFactory.id('relationType4');

// Dictionary ID
const dictionary = fixtureFactory.id('dictionary');

// Property IDs
const inheritedProperty = fixtureFactory.id('inheritedProperty');

// Permissions constant
const permissions = [{ refId: 'userId', level: AccessLevels.WRITE, type: PermissionType.USER }];

const fixtures: DBFixture = {
  users: [
    fixtureFactory.user('admin', UserRole.ADMIN, 'admin@uwazi.com', 'hashedpass'),
    fixtureFactory.user('user1', UserRole.EDITOR, 'user1@uwazi.com', 'hashedpass'),
    fixtureFactory.user('user2', UserRole.EDITOR, 'user2@uwazi.com', 'hashedpass'),
  ],

  files: [
    // Files for 'shared' entity
    fixtureFactory.file('shared-thumb-en', {
      entity: 'shared',
      filename: `${uploadId1}.jpg`,
      language: 'en',
      type: 'thumbnail',
      mimetype: 'image/jpeg',
    }),
    fixtureFactory.file('shared-thumb-es', {
      entity: 'shared',
      filename: `${uploadId2}.jpg`,
      language: 'es',
      type: 'thumbnail',
      mimetype: 'image/jpeg',
    }),
    fixtureFactory.document('shared-doc-en', {
      _id: uploadId1,
      entity: 'shared',
      filename: '8202c463d6158af8065022d9b5014cc1.pdf',
      language: 'en',
      mimetype: 'application/pdf',
      fullText: {
        1: 'page[[1]] 1[[1]]',
        2: 'page[[2]] 2[[2]]',
        3: '',
      },
    }),
    fixtureFactory.document('shared-doc-es', {
      _id: uploadId2,
      entity: 'shared',
      filename: '8202c463d6158af8065022d9b5014ccb.pdf',
      language: 'es',
      mimetype: 'application/pdf',
      fullText: { 1: 'text' },
    }),
    fixtureFactory.attachment('shared-attachment-pt', {
      entity: 'shared',
      filename: '8202c463d6158af8065022d9b5014ccc.pdf',
      language: 'pt',
      mimetype: 'application/pdf',
    }),
    // Files for 'shared1' entity
    fixtureFactory.document('shared1-doc-en', {
      entity: 'shared1',
      language: 'en',
      filename: 'nonexistent.pdf',
      mimetype: 'application/pdf',
      fullText: { 1: 'text' },
    }),
    fixtureFactory.document('shared1-doc-es', {
      entity: 'shared1',
      filename: 'nonexistent.pdf',
      language: 'es',
      mimetype: 'application/pdf',
    }),
    fixtureFactory.document('shared1-doc-pt', {
      entity: 'shared1',
      filename: 'nonexistent.pdf',
      mimetype: 'application/pdf',
      language: 'pt',
    }),
  ],

  entities: [
    // 'shared' entity (en, es, pt)
    fixtureFactory.entity(
      'shared',
      'template_test',
      {
        text: [{ value: 'textvalue' }],
        property1: [{ value: 'value1' }],
        property2: [{ value: 'value2' }],
        description: [{ value: 'descriptionvalue' }],
        friends: [{ icon: null, label: 'shared2title', type: 'entity', value: 'shared2' }],
        enemies: [{ icon: null, label: 'shared2title', type: 'entity', value: 'shared2' }],
        select: [],
      },
      {
        _id: batmanFinishesId,
        type: 'entity',
        language: 'en',
        title: 'Batman finishes',
        published: true,
      }
    ),
    fixtureFactory.entity(
      'shared',
      'template_test',
      {},
      {
        _id: docId1,
        type: 'entity',
        language: 'es',
        title: 'Penguin almost done',
        creationDate: 1,
        published: true,
      }
    ),
    fixtureFactory.entity(
      'shared',
      'template_test',
      { text: [{ value: 'test' }] },
      {
        _id: docId2,
        type: 'entity',
        language: 'pt',
        title: 'Penguin almost done',
        creationDate: 1,
        published: true,
      }
    ),
    // 'shared1' entity (en, es, pt)
    fixtureFactory.entity(
      'shared1',
      'template_test',
      { property1: [{ value: 'text' }] },
      {
        type: 'entity',
        language: 'en',
        title: 'EN',
        published: true,
        permissions: [
          { refId: user1Id, level: AccessLevels.WRITE, type: PermissionType.USER },
          { refId: 'group1', level: AccessLevels.WRITE, type: PermissionType.GROUP },
        ],
      }
    ),
    fixtureFactory.entity(
      'shared1',
      'template_test',
      { property1: [{ value: 'text' }] },
      {
        type: 'entity',
        language: 'es',
        title: 'ES',
        creationDate: 1,
        published: true,
        permissions: [
          { refId: user1Id, level: AccessLevels.WRITE, type: PermissionType.USER },
          { refId: 'group1', level: AccessLevels.WRITE, type: PermissionType.GROUP },
        ],
      }
    ),
    fixtureFactory.entity(
      'shared1',
      'template_test',
      { property1: [{ value: 'text' }] },
      {
        type: 'entity',
        language: 'pt',
        title: 'PT',
        creationDate: 1,
        published: true,
        permissions: [
          { refId: user1Id, level: AccessLevels.WRITE, type: PermissionType.USER },
          { refId: 'group1', level: AccessLevels.WRITE, type: PermissionType.GROUP },
        ],
      }
    ),
    // 'shared2' entity
    fixtureFactory.entity(
      'shared2',
      'template_test',
      {
        property1: [{ value: 'something to be inherited' }],
      },
      {
        _id: shared2Id,
        language: 'en',
        title: 'shared2title',
        published: true,
      }
    ),
    // 'other' entity (unpublished with permissions) - en
    fixtureFactory.entity(
      'other',
      'template_test',
      {
        property2: [{ value: 'value1' }],
        enemies: [
          { icon: null, label: 'shouldNotChange', type: 'entity', value: 'shared1' },
          { icon: null, label: 'shared2title', type: 'entity', value: 'shared2' },
          { icon: null, label: 'shouldNotChange1', type: 'entity', value: 'shared1' },
        ],
      },
      {
        _id: unpublishedDocId,
        type: 'entity',
        language: 'en',
        title: 'Unpublished entity',
        published: false,
        permissions: [
          { refId: user1Id, level: AccessLevels.READ, type: PermissionType.USER },
          { refId: user2Id, level: AccessLevels.WRITE, type: PermissionType.USER },
        ],
      }
    ),
    // 'other' entity (unpublished with permissions) - es
    fixtureFactory.entity(
      'other',
      'template_test',
      {
        enemies: [
          { icon: null, label: 'translated1', type: 'entity', value: 'shared2' },
          { icon: null, label: 'translated2', type: 'entity', value: 'shared1' },
        ],
      },
      {
        title: 'Unpublished entity ES',
        language: 'es',
        permissions: [
          { refId: user1Id, level: AccessLevels.READ, type: PermissionType.USER },
          { refId: user2Id, level: AccessLevels.WRITE, type: PermissionType.USER },
        ],
      }
    ),
    // 'sharedPerm' entity
    fixtureFactory.entity(
      'sharedPerm',
      'template_test',
      {},
      {
        title: 'Entity With Permissions',
        language: 'es',
        permissions,
      }
    ),
    // Entities for relationship testing
    fixtureFactory.entity(
      'getWithRelRoot',
      'templateForGetWithRelationships',
      {},
      {
        language: 'es',
        title: 'root entity',
        published: true,
      }
    ),
    fixtureFactory.entity(
      'getWithRelPublic',
      'templateForGetWithRelationships',
      {},
      {
        language: 'es',
        title: 'public entity',
        published: true,
      }
    ),
    fixtureFactory.entity(
      'getWithRelPrivate',
      'templateForGetWithRelationships',
      {},
      {
        language: 'es',
        title: 'private entity',
      }
    ),
    // V2 metadata filtering test entities
    fixtureFactory.entity(
      'unpublishedForTest',
      'template_test',
      {},
      {
        type: 'entity',
        language: 'en',
        title: 'Unpublished Test Entity',
        published: false,
      }
    ),
    fixtureFactory.entity(
      'testEntityWithMixedRefs',
      'template_test',
      {
        friends: [
          { icon: null, label: 'shared1title', type: 'entity', value: 'shared1' },
          {
            icon: null,
            label: 'Unpublished Test Entity',
            type: 'entity',
            value: 'unpublishedForTest',
          },
        ],
      },
      {
        type: 'entity',
        language: 'en',
        title: 'Entity With Mixed References',
        published: true,
      }
    ),
    fixtureFactory.entity(
      'entityPointingToOther',
      'template_test',
      {
        friends: [{ icon: null, label: 'Unpublished entity', type: 'entity', value: 'other' }],
      },
      {
        type: 'entity',
        language: 'en',
        title: 'Entity Pointing To Other',
        published: true,
      }
    ),
    fixtureFactory.entity(
      'restrictedEntity',
      'template_test',
      {},
      {
        type: 'entity',
        language: 'en',
        title: 'Restricted Entity',
        published: false,
        permissions: [{ refId: user1Id, level: AccessLevels.READ, type: PermissionType.USER }],
      }
    ),
    fixtureFactory.entity(
      'entityWithRestrictedRef',
      'template_test',
      {
        friends: [
          { icon: null, label: 'shared2title', type: 'entity', value: 'shared2' },
          { icon: null, label: 'Restricted Entity', type: 'entity', value: 'restrictedEntity' },
        ],
      },
      {
        type: 'entity',
        language: 'en',
        title: 'Entity With Restricted Ref',
        published: true,
      }
    ),
    fixtureFactory.entity(
      'entityWithOnlyRestrictedRefs',
      'template_test',
      {
        friends: [
          { icon: null, label: 'Restricted Entity', type: 'entity', value: 'restrictedEntity' },
          {
            icon: null,
            label: 'Unpublished Test Entity',
            type: 'entity',
            value: 'unpublishedForTest',
          },
        ],
      },
      {
        type: 'entity',
        language: 'en',
        title: 'Entity With Only Restricted Refs',
        published: true,
      }
    ),
    fixtureFactory.entity(
      'entityWithMixedAccess',
      'template_test',
      {
        friends: [
          { icon: null, label: 'shared1title', type: 'entity', value: 'shared1' },
          { icon: null, label: 'shared2title', type: 'entity', value: 'shared2' },
        ],
        enemies: [
          { icon: null, label: 'shared1title', type: 'entity', value: 'shared1' },
          { icon: null, label: 'Restricted Entity', type: 'entity', value: 'restrictedEntity' },
          { icon: null, label: 'shared2title', type: 'entity', value: 'shared2' },
        ],
      },
      {
        type: 'entity',
        language: 'en',
        title: 'Entity With Mixed Access',
        published: true,
      }
    ),
    fixtureFactory.entity(
      'entityReferencingUnpublished',
      'template_test',
      {
        friends: [
          { icon: null, label: 'shared2title', type: 'entity', value: 'shared2' },
          {
            icon: null,
            label: 'Unpublished Test Entity',
            type: 'entity',
            value: 'unpublishedForTest',
          },
        ],
      },
      {
        type: 'entity',
        language: 'en',
        title: 'Entity Referencing Unpublished',
        published: true,
      }
    ),
  ],

  settings: [
    {
      _id: db.id(),
      languages: [
        { key: 'es', default: true, label: 'Spanish' },
        { key: 'pt', label: 'Portuguese' },
        { key: 'en', label: 'English' },
      ],
      featureFlags: { v2UpdateEntity: true },
      features: {
        filterUnauthorizedRelated: false,
      },
    } as any,
  ],

  templates: [
    fixtureFactory.template('template_test', [
      fixtureFactory.property('text', 'text'),
      fixtureFactory.property('property1', 'text', { _id: inheritedProperty }),
      fixtureFactory.property('property2', 'text'),
      fixtureFactory.property('description', 'text'),
      fixtureFactory.property('select', 'select', { content: dictionary.toString() }),
      fixtureFactory.property('multiselect', 'multiselect', { content: dictionary.toString() }),
      fixtureFactory.property('date', 'date'),
      fixtureFactory.property('multidate', 'multidate'),
      fixtureFactory.property('multidaterange', 'multidaterange'),
      fixtureFactory.property('daterange', 'daterange'),
      fixtureFactory.relationshipProp('friends', undefined, {
        relationType: relationType1.toString(),
      }),
      fixtureFactory.relationshipProp('enemies', 'template_test', {
        relationType: relationType4.toString(),
        inherit: {
          property: inheritedProperty.toString(),
          type: 'text',
        },
      }),
      fixtureFactory.property('field_nested', 'nested'),
      fixtureFactory.property('numeric', 'numeric'),
    ]),
    fixtureFactory.template('templateForGetWithRelationships', [], {
      _id: templateForGetWithRelationships,
    }),
  ],

  relationtypes: [
    fixtureFactory.relationType('relationType1'),
    fixtureFactory.relationType('relationType4'),
  ],

  connections: [
    ...fixtureFactory.hub('hub8', 'getWithRelRoot', [
      { entity: 'getWithRelPublic', template: 'relationType4' },
      { entity: 'getWithRelPrivate', template: 'relationType4' },
    ]),
  ],

  dictionaries: [
    {
      _id: dictionary,
      name: 'Countries',
      values: [
        { _id: db.id(), id: 'country_one', label: 'Country1' } as any,
        { _id: db.id(), id: 'country_two', label: 'Country2' } as any,
        {
          id: 'towns',
          label: 'Towns',
          values: [
            { id: 'town1', label: 'Town1' },
            { id: 'town2', label: 'Town2' },
          ],
        },
      ],
    },
  ],
};

export default fixtures;
export { adminId, user1Id, user2Id, unpublishedDocId, permissions, templateId };
