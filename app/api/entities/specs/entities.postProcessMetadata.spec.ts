import users from 'api/users/users';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { UserRole } from 'shared/types/userSchema';
import entities from '../entities';

const factory = getFixturesFactory();

const adminPermission = {
  refId: factory.id('admin').toString(),
  type: 'user' as 'user',
  level: 'write' as 'write',
};

const fixtures: DBFixture = {
  users: [
    factory.user('admin', UserRole.ADMIN),
    factory.user('collaborator', UserRole.COLLABORATOR),
  ],
  relationshipTypes: [factory.relationType('related'), factory.relationType('related_to_any')],
  templates: [
    factory.template('source', [factory.property('text', 'text')]),
    factory.template('target', [
      factory.property('unrelated_text', 'text'),
      factory.property('relationship', 'relationship', {
        content: factory.idString('source'),
        relationType: factory.idString('related'),
      }),
      factory.property('relationship_to_any', 'relationship', {
        content: '',
        relationType: factory.idString('related_to_any'),
      }),
    ]),
    factory.template('target2', [
      factory.property('unrelated_text', 'text'),
      factory.property('other_relationship', 'relationship', {
        content: factory.idString('source'),
        relationType: factory.idString('related'),
      }),
      factory.property('other_relationship_to_any', 'relationship', {
        content: '',
        relationType: factory.idString('related_to_any'),
      }),
    ]),
  ],
  entities: [
    factory.entity(
      'S1',
      'source',
      { text: [{ value: 'admin unpublished' }] },
      {
        published: false,
        user: factory.id('admin'),
        permissions: [adminPermission],
      }
    ),
    factory.entity(
      'S2',
      'source',
      { text: [{ value: 'admin shared with collaborators unpublished' }] },
      {
        published: false,
        user: factory.id('admin'),
        permissions: [
          adminPermission,
          {
            refId: factory.id('collaborator').toString(),
            type: 'user',
            level: 'read',
          },
        ],
      }
    ),
    factory.entity(
      'S3',
      'source',
      { text: [{ value: 'collaborator unpublished' }] },
      {
        published: false,
        user: factory.id('collaborator'),
        permissions: [
          {
            refId: factory.id('collaborator').toString(),
            type: 'user',
            level: 'write',
          },
        ],
      }
    ),
    factory.entity(
      'S4',
      'source',
      { text: [{ value: 'admin published' }] },
      {
        published: true,
        user: factory.id('admin'),
        permissions: [adminPermission],
      }
    ),
    factory.entity(
      'T1',
      'target',
      {
        unrelated_text: [{ value: 'admin published with relationships' }],
        relationship: [
          { value: 'S1', label: 'S1', type: 'entity', published: false },
          { value: 'S2', label: 'S2', type: 'entity', published: false },
        ],
        relationship_to_any: [
          { value: 'S3', label: 'S3', type: 'entity', published: false },
          { value: 'S4', label: 'S4', type: 'entity', published: true },
        ],
      },
      {
        published: true,
        user: factory.id('admin'),
        permissions: [adminPermission],
      }
    ),
    factory.entity(
      'T2',
      'target2',
      {
        unrelated_text: [{ value: 'admin published with relationships 2' }],
        other_relationship: [
          { value: 'S1', label: 'S1', type: 'entity', published: false },
          { value: 'S3', label: 'S3', type: 'entity', published: false },
        ],
        other_relationship_to_any: [
          { value: 'S2', label: 'S2', type: 'entity', published: false },
          { value: 'S4', label: 'S4', type: 'entity', published: true },
        ],
      },
      {
        published: true,
        user: factory.id('admin'),
        permissions: [adminPermission],
      }
    ),
    factory.entity(
      'T3',
      'target',
      {
        unrelated_text: [{ value: 'admin published with empty relationships' }],
        relationship: [],
        relationship_to_any: [],
      },
      {
        published: true,
        user: factory.id('admin'),
        permissions: [adminPermission],
      }
    ),
  ],
};

describe('postProcessMetadata', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
    const [collaboratorUser] = await users.get({ username: 'collaborator' });
    testingEnvironment.setPermissions(collaboratorUser);
  });

  it('should append the renderLink flag to relationship metadata', async () => {
    const metadata = (await entities.get({ sharedId: { $in: ['T1', 'T2'] } })).map(
      (e: any) => e.metadata
    );
    expect(metadata).toEqual([
      {
        unrelated_text: [{ value: 'admin published with relationships' }],
        relationship: [
          { value: 'S1', label: 'S1', type: 'entity', published: false },
          { value: 'S2', label: 'S2', type: 'entity', published: false, renderLink: true },
        ],
        relationship_to_any: [
          { value: 'S3', label: 'S3', type: 'entity', published: false, renderLink: true },
          { value: 'S4', label: 'S4', type: 'entity', published: true, renderLink: true },
        ],
      },
      {
        unrelated_text: [{ value: 'admin published with relationships 2' }],
        other_relationship: [
          { value: 'S1', label: 'S1', type: 'entity', published: false },
          { value: 'S3', label: 'S3', type: 'entity', published: false, renderLink: true },
        ],
        other_relationship_to_any: [
          { value: 'S2', label: 'S2', type: 'entity', published: false, renderLink: true },
          { value: 'S4', label: 'S4', type: 'entity', published: true, renderLink: true },
        ],
      },
    ]);
  });

  it('should not fail on empty relationships', async () => {
    const [entity] = await entities.get({ sharedId: 'T3' });
    expect(entity.metadata).toEqual({
      unrelated_text: [{ value: 'admin published with empty relationships' }],
      relationship: [],
      relationship_to_any: [],
    });
  });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});
