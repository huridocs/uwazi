import { Db } from 'mongodb';

import { MongoResultSet } from '#api/core/infrastructure/mongodb/common/MongoResultSet.js';

import { getFixturesFactory } from '#api/utils/fixturesFactory.js';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import testingDB, { DBFixture } from '#api/utils/testing_db.js';

import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';
import { MongoPermissionsDataSource } from '#api/authorization.v2/database/MongoPermissionsDataSource.js';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  templates: [factory.template('template1')],
  entities: [
    factory.entity(
      'entity1',
      'template1',
      {},
      {
        permissions: [
          factory.entityPermission('user1', 'user', 'read'),
          factory.entityPermission('group1', 'group', 'write'),
        ],
      }
    ),
    factory.entity(
      'entity2',
      'template1',
      {},
      {
        published: true,
        permissions: [factory.entityPermission('user1', 'user', 'write')],
      }
    ),
  ],
};

describe('MongoPermissionsDataSource', () => {
  let db: Db | null;

  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
    db = testingDB.mongodb;
  });

  it.each([
    {
      sharedIds: ['entity1'],
      expected: [
        factory.v2.application.entityPermissions('entity1', false, [
          { refId: 'user1', type: 'user', level: 'read' },
          { refId: 'group1', type: 'group', level: 'write' },
        ]),
      ],
    },
    {
      sharedIds: ['entity2'],
      expected: [
        factory.v2.application.entityPermissions('entity2', true, [
          { refId: 'user1', type: 'user', level: 'write' },
        ]),
      ],
    },
    {
      sharedIds: ['entity1', 'entity2'],
      expected: [
        factory.v2.application.entityPermissions('entity1', false, [
          { refId: 'user1', type: 'user', level: 'read' },
          { refId: 'group1', type: 'group', level: 'write' },
        ]),
        factory.v2.application.entityPermissions('entity2', true, [
          { refId: 'user1', type: 'user', level: 'write' },
        ]),
      ],
    },
    {
      sharedIds: ['nonExistingEntity'],
      expected: [],
    },
  ])(
    'should return the permissions for entities with the given sharedIds',
    async ({ sharedIds, expected }) => {
      const dataSource = new MongoPermissionsDataSource(db!, TransactionManagerFactory.default());
      const resultSet = dataSource.getByEntities(sharedIds);
      expect(resultSet).toBeInstanceOf(MongoResultSet);
      const result = await resultSet.all();
      expect(result).toEqual(expected);
    }
  );

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });
});
