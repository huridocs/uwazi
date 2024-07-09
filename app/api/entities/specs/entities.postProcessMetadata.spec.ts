import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { UserRole } from 'shared/types/userSchema';
import entities from '../entities';
import users from 'api/users/users';

const factory = getFixturesFactory();

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
  ],
  entities: [
    factory.entity(
      'S1',
      'source',
      { text: [{ value: 'admin unpublished' }] },
      {
        published: false,
        user: factory.id('admin'),
        permissions: [factory.entityPermission('admin', 'user', 'write')],
      }
    ),
    factory.entity(
      'S2',
      'source',
      { text: [{ value: 'shared unpublished' }] },
      {
        published: false,
        user: factory.id('admin'),
        permissions: [
          factory.entityPermission('admin', 'user', 'write'),
          factory.entityPermission('collaborator', 'user', 'read'),
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
        permissions: [factory.entityPermission('collaborator', 'user', 'write')],
      }
    ),
    factory.entity(
      'S4',
      'source',
      { text: [{ value: 'admin published' }] },
      {
        published: true,
        user: factory.id('admin'),
        permissions: [factory.entityPermission('admin', 'user', 'write')],
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
        permissions: [factory.entityPermission('admin', 'user', 'write')],
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
    const [entity] = await entities.get({ sharedId: 'T1' });
    expect(entity.metadata).toEqual({
      unrelated_text: [{ value: 'admin published with relationships' }],
      relationship: [
        { value: 'S1', label: 'S1', type: 'entity', published: false, renderLink: false },
        { value: 'S2', label: 'S2', type: 'entity', published: false, renderLink: true },
      ],
      relationship_to_any: [
        { value: 'S3', label: 'S3', type: 'entity', published: false, renderLink: true },
        { value: 'S4', label: 'S4', type: 'entity', published: true, renderLink: true },
      ],
    });
  });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});
