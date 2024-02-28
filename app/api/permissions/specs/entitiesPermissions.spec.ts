/* eslint-disable max-lines */
import db, { DBFixture, testingDB } from 'api/utils/testing_db';
import entities from 'api/entities/entities';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { entitiesPermissions } from 'api/permissions/entitiesPermissions';
import { AccessLevels, PermissionType, MixedAccess } from 'shared/types/permissionSchema';
import { fixtures, groupA, userA, userB } from 'api/permissions/specs/fixtures';
import { EntitySchema, EntityWithFilesSchema } from 'shared/types/entityType';
import { PermissionsDataSchema } from 'shared/types/permissionType';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';
import { PUBLIC_PERMISSION } from '../publicPermission';
import { elasticTesting } from 'api/utils/elastic_testing';

const publicPermission = {
  ...PUBLIC_PERMISSION,
  level: AccessLevels.READ,
};

const factory = getFixturesFactory();

const mockCollab = () =>
  new UserInContextMockFactory().mock({
    _id: 'userId',
    role: 'collaborator',
    username: 'username',
    email: 'email',
  });

describe('permissions', () => {
  beforeEach(async () => {
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  describe('set entities permissions', () => {
    it('should update the specified entities with the passed permissions in all entities languages', async () => {
      const permissionsData: PermissionsDataSchema = {
        ids: ['shared1', 'shared2'],
        permissions: [
          { refId: 'user1', type: PermissionType.USER, level: AccessLevels.READ },
          { refId: 'user2', type: PermissionType.USER, level: AccessLevels.WRITE },
          publicPermission,
        ],
      };
      await entitiesPermissions.set(permissionsData);
      mockCollab();
      const storedEntities = await entities.getUnrestricted({}, 'sharedId +permissions');
      const updateEntities = storedEntities.filter(entity =>
        ['shared1', 'shared2'].includes(entity.sharedId!)
      );
      updateEntities.forEach(entity => {
        expect(entity.permissions).toEqual(
          permissionsData.permissions.filter(p => p.type !== PermissionType.PUBLIC)
        );
      });
      const notUpdatedEntities = storedEntities.filter(
        entity => !['shared1', 'shared2'].includes(entity.sharedId!)
      );
      notUpdatedEntities.forEach(entity => {
        expect(entity.permissions).toBe(undefined);
      });
    });

    it('should invalidate if permissions are duplicated', async () => {
      const permissionsData: PermissionsDataSchema = {
        ids: ['shared1'],
        permissions: [
          { refId: 'user1', type: 'user', level: 'write' },
          { refId: 'user1', type: 'user', level: 'read' },
        ],
      };
      mockCollab();

      try {
        await entitiesPermissions.set(permissionsData);
        fail('should throw error');
      } catch (e) {
        expect(e.errors[0].keyword).toEqual('duplicatedPermissions');
      }
    });

    it('should preserve permission level if mixed access passed', async () => {
      const permissionsData: PermissionsDataSchema = {
        ids: ['shared2', 'shared4'],
        permissions: [
          {
            refId: userA._id,
            type: PermissionType.USER,
            level: AccessLevels.WRITE,
          },
          {
            refId: groupA._id,
            type: PermissionType.GROUP,
            level: MixedAccess.MIXED,
          },
          { ...publicPermission, level: MixedAccess.MIXED },
        ],
      };

      await entitiesPermissions.set(permissionsData);

      const storedEntities = await entities.getUnrestricted(
        { sharedId: { $in: permissionsData.ids } },
        'sharedId published +permissions'
      );

      expect(storedEntities[0].permissions?.length).toBe(2);
      expect(storedEntities[0].permissions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            refId: userA._id,
            level: AccessLevels.WRITE,
          }),
          expect.objectContaining({
            refId: groupA._id,
            level: AccessLevels.READ,
          }),
        ])
      );
      expect(storedEntities[0].published).toBe(true);

      expect(storedEntities[2].permissions?.length).toBe(1);
      expect(storedEntities[2].permissions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            refId: userA._id,
            level: AccessLevels.WRITE,
          }),
        ])
      );
      expect(storedEntities[2].published).toBe(false);
    });

    it.each<{
      case: string;
      permissionInput: PermissionsDataSchema;
      expectedMetadata: Record<string, { value: string; published: boolean }[]>[];
    }>([
      {
        case: 'set to public',
        permissionInput: {
          ids: ['source11', 'source12', 'source23'],
          permissions: [
            { refId: 'some_user_refId', type: 'user', level: 'write' },
            { refId: 'public', type: 'public', level: 'read' },
          ],
        },
        expectedMetadata: [
          {
            relationship_11: [
              {
                value: 'source11',
                published: true,
              },
              {
                value: 'source12',
                published: true,
              },
            ],
            relationship_12: [
              {
                value: 'source21',
                published: true,
              },
              {
                value: 'source22',
                published: false,
              },
            ],
            unrelated_relationship: [
              {
                value: 'unrelated_entity',
                published: true,
              },
            ],
          },
          {
            relationship_11: [
              {
                value: 'source12',
                published: true,
              },
              {
                value: 'source13',
                published: true,
              },
            ],
            relationship_12: [
              {
                value: 'source22',
                published: true,
              },
              {
                value: 'source23',
                published: true,
              },
            ],
            unrelated_relationship: [],
          },
          {
            relationship_21: [
              {
                value: 'source11',
                published: true,
              },
              {
                value: 'source12',
                published: true,
              },
            ],
            relationship_22: [
              {
                value: 'source21',
                published: false,
              },
              {
                value: 'source22',
                published: true,
              },
            ],
          },
          {
            relationship_21: [
              {
                value: 'source12',
                published: true,
              },
              {
                value: 'source13',
                published: true,
              },
            ],
            relationship_22: [
              {
                value: 'source22',
                published: true,
              },
              {
                value: 'source23',
                published: true,
              },
            ],
          },
        ],
      },
      {
        case: 'set to private',
        permissionInput: {
          ids: ['source11', 'source12', 'source23'],
          permissions: [{ refId: 'some_user_refId', type: 'user', level: 'write' }],
        },
        expectedMetadata: [
          {
            relationship_11: [
              {
                value: 'source11',
                published: false,
              },
              {
                value: 'source12',
                published: false,
              },
            ],
            relationship_12: [
              {
                value: 'source21',
                published: true,
              },
              {
                value: 'source22',
                published: false,
              },
            ],
            unrelated_relationship: [
              {
                value: 'unrelated_entity',
                published: true,
              },
            ],
          },
          {
            relationship_11: [
              {
                value: 'source12',
                published: false,
              },
              {
                value: 'source13',
                published: true,
              },
            ],
            relationship_12: [
              {
                value: 'source22',
                published: true,
              },
              {
                value: 'source23',
                published: false,
              },
            ],
            unrelated_relationship: [],
          },
          {
            relationship_21: [
              {
                value: 'source11',
                published: false,
              },
              {
                value: 'source12',
                published: false,
              },
            ],
            relationship_22: [
              {
                value: 'source21',
                published: false,
              },
              {
                value: 'source22',
                published: true,
              },
            ],
          },
          {
            relationship_21: [
              {
                value: 'source12',
                published: false,
              },
              {
                value: 'source13',
                published: true,
              },
            ],
            relationship_22: [
              {
                value: 'source22',
                published: true,
              },
              {
                value: 'source23',
                published: false,
              },
            ],
          },
        ],
      },
    ])(
      'should denormalize published state when $case, and reindex touched entities',
      async ({ permissionInput, expectedMetadata }) => {
        const publishedStateTestFixtures: DBFixture = {
          settings: [
            {
              _id: db.id(),
              languages: [
                { key: 'en', label: 'EN', default: true },
                { key: 'es', label: 'ES' },
              ],
            },
          ],
          templates: [
            factory.template('sourceTemplate1', [factory.property('text1')]),
            factory.template('sourceTemplate2', [factory.property('text2')]),
            factory.template('unrelatedTemplate', [factory.property('unrelated_text_prop')]),
            factory.template('relationshipTemplate1', [
              factory.relationshipProp('relationship_11', 'sourceTemplate1'),
              factory.inherit('relationship_12', 'sourceTemplate2', 'text2'),
              factory.relationshipProp('unrelated_relationship', 'unrelatedTemplate'),
            ]),
            factory.template('relationshipTemplate2', [
              factory.inherit('relationship_21', 'sourceTemplate1', 'text1'),
              factory.relationshipProp('relationship_22', 'sourceTemplate2'),
            ]),
          ],
          entities: [
            factory.entity(
              'source11',
              'sourceTemplate1',
              { text1: [factory.metadataValue('A')] },
              { published: true }
            ),
            factory.entity(
              'source12',
              'sourceTemplate1',
              { text1: [factory.metadataValue('B')] },
              { published: false }
            ),
            factory.entity(
              'source13',
              'sourceTemplate1',
              { text1: [factory.metadataValue('C')] },
              { published: true }
            ),
            factory.entity(
              'source21',
              'sourceTemplate2',
              { text2: [factory.metadataValue('D')] },
              { published: false }
            ),
            factory.entity(
              'source22',
              'sourceTemplate2',
              { text2: [factory.metadataValue('E')] },
              { published: true }
            ),
            factory.entity(
              'source23',
              'sourceTemplate2',
              { text2: [factory.metadataValue('F')] },
              { published: false }
            ),
            factory.entity('unrelated_entity', 'unrelatedTemplate', {}, { published: true }),
            factory.entity('relationship11', 'relationshipTemplate1', {
              relationship_11: [
                { value: 'source11', label: 'source11', published: true },
                { value: 'source12', label: 'source12', published: false },
              ],
              relationship_12: [
                {
                  value: 'source21',
                  label: 'source21',
                  published: true,
                  inheritedValue: [{ value: 'C' }],
                },
                {
                  value: 'source22',
                  label: 'source22',
                  published: false,
                  inheritedValue: [{ value: 'D' }],
                },
              ],
              unrelated_relationship: [
                { value: 'unrelated_entity', label: 'unrelated_entity', published: true },
              ],
            }),
            factory.entity('relationship12', 'relationshipTemplate1', {
              relationship_11: [
                { value: 'source12', label: 'source12', published: false },
                { value: 'source13', label: 'source13', published: true },
              ],
              relationship_12: [
                {
                  value: 'source22',
                  label: 'source22',
                  published: true,
                  inheritedValue: [{ value: 'E' }],
                },
                {
                  value: 'source23',
                  label: 'source23',
                  published: false,
                  inheritedValue: [{ value: 'F' }],
                },
              ],
              unrelated_relationship: [],
            }),
            factory.entity('relationship21', 'relationshipTemplate2', {
              relationship_21: [
                {
                  value: 'source11',
                  label: 'source11',
                  published: true,
                  inheritedValue: [{ value: 'A' }],
                },
                {
                  value: 'source12',
                  label: 'source12',
                  published: false,
                  inheritedValue: [{ value: 'B' }],
                },
              ],
              relationship_22: [
                { value: 'source21', label: 'source21', published: false },
                { value: 'source22', label: 'source22', published: true },
              ],
            }),
            factory.entity('relationship22', 'relationshipTemplate2', {
              relationship_21: [
                { value: 'source12', label: 'source12', published: false },
                { value: 'source13', label: 'source13', published: true },
              ],
              relationship_22: [
                { value: 'source22', label: 'source22', published: true },
                { value: 'source23', label: 'source23', published: false },
              ],
            }),
          ],
        };
        await db.setupFixturesAndContext(
          publishedStateTestFixtures,
          'published_denormalization_index'
        );
        await entitiesPermissions.set(permissionInput);

        const relTemplateId1 = factory.id('relationshipTemplate1');
        const relTemplateId2 = factory.id('relationshipTemplate2');

        const entites = await entities.get(
          { template: { $in: [relTemplateId1, relTemplateId2] } },
          {},
          { sort: 'title' }
        );
        const metadata = entites.map((e: EntitySchema) => e.metadata);
        expect(metadata).toMatchObject(expectedMetadata);

        await elasticTesting.refresh();
        const indexed = (await elasticTesting.getIndexedEntities()).filter(
          e => e.template === relTemplateId1.toString() || e.template === relTemplateId2.toString()
        );
        const metadataInIndex = indexed.map((e: EntitySchema) => e.metadata);
        expect(metadataInIndex).toMatchObject(expectedMetadata);
      }
    );

    describe('share publicly', () => {
      it('should save the entity with the publish field set to the correct value', async () => {
        const permissionsData: PermissionsDataSchema = {
          ids: ['shared1', 'shared2'],
          permissions: [{ refId: 'user1', type: 'user', level: 'write' }],
        };

        new UserInContextMockFactory().mockEditorUser();

        await entitiesPermissions.set(permissionsData);
        let storedEntities: EntityWithFilesSchema[] = await entities.get(
          { sharedId: 'shared1' },
          '+permissions'
        );

        storedEntities.forEach(entity => {
          expect(entity.permissions).toEqual(permissionsData.permissions);
          expect(entity.published).toBe(false);
        });

        permissionsData.permissions.push({ ...PUBLIC_PERMISSION, level: 'read' });
        await entitiesPermissions.set(permissionsData);
        storedEntities = await entities.get({ sharedId: 'shared1' }, '+permissions');

        storedEntities.forEach(entity => {
          expect(entity.permissions).toEqual([permissionsData.permissions[0]]);
          expect(entity.published).toBe(true);
        });
      });

      it('should throw if non admin/editor changes the publishing status', async () => {
        const permissionsData: PermissionsDataSchema = {
          ids: ['shared1'],
          permissions: [{ refId: 'user1', type: 'user', level: 'write' }],
        };

        mockCollab();

        try {
          await entitiesPermissions.set(permissionsData);
          fail('should throw forbidden exception');
        } catch (e) {
          const storedEntities = await entities.get({ sharedId: 'shared1' });
          expect(storedEntities[0].published).toBe(true);
        }
      });
    });
  });

  describe('get entities permissions', () => {
    it('should return the permissions of the requested entities', async () => {
      const permissions = await entitiesPermissions.get(['shared1', 'shared2']);
      expect(permissions).toEqual([
        {
          refId: groupA._id,
          label: groupA.name,
          level: MixedAccess.MIXED,
          type: PermissionType.GROUP,
        },
        publicPermission,
        {
          refId: userA._id,
          label: userA.username,
          level: AccessLevels.READ,
          type: PermissionType.USER,
        },
        {
          refId: userB._id,
          label: userB.username,
          level: MixedAccess.MIXED,
          type: PermissionType.USER,
        },
      ]);
    });

    it('should return mixed permissions in case one of the entities does not have any', async () => {
      const permissions = await entitiesPermissions.get(['shared1', 'shared3']);
      expect(permissions).toEqual([
        {
          refId: groupA._id,
          label: groupA.name,
          level: MixedAccess.MIXED,
          type: PermissionType.GROUP,
        },
        publicPermission,
        {
          refId: userA._id,
          label: userA.username,
          level: MixedAccess.MIXED,
          type: PermissionType.USER,
        },
        {
          refId: userB._id,
          label: userB.username,
          level: MixedAccess.MIXED,
          type: PermissionType.USER,
        },
      ]);
    });

    describe('publicly shared', () => {
      it('should return a permission of type "public" and level "mixed" if the entities are published and unpublished', async () => {
        const permissions = await entitiesPermissions.get(['shared1', 'shared4']);
        expect(permissions).toEqual(
          expect.arrayContaining([{ ...publicPermission, level: MixedAccess.MIXED }])
        );
      });

      it('should return a permission of type "public" and level "read" if the entity is published', async () => {
        const permissions = await entitiesPermissions.get(['shared1']);
        expect(permissions).toEqual(expect.arrayContaining([publicPermission]));
      });

      it('should NOT return a permission of type "public" if the entity is not published', async () => {
        const permissions = await entitiesPermissions.get(['shared4']);
        expect(permissions).toEqual([]);
      });
    });
  });
});
