import { PermissionSchema } from 'shared/types/permissionType';
import { AccessLevels, permissionSchema, PermissionType } from 'shared/types/permissionSchema';
import { instanceModel, ModelWithPermissions } from 'api/odm/ModelWithPermissions';
import { permissionsContext } from 'api/permissions/permissionsContext';
import testingDB from 'api/utils/testing_db';
import * as mongoose from 'mongoose';

describe('ModelWithPermissions', () => {
  let model: ModelWithPermissions<any>;

  interface TestDoc {
    name?: string;
    permissions: PermissionSchema[];
  }
  let connection;
  const testSchema = new mongoose.Schema({
    name: String,
    permissions: {
      type: 'array',
      items: permissionSchema,
    },
    fixed: Boolean,
  });
  const readDocId = testingDB.id();
  const writeDocId = testingDB.id();
  const deleteDocId = testingDB.id();
  const otherOwnerId = testingDB.id();
  const public1Id = testingDB.id();
  const testdocs = [
    {
      _id: readDocId,
      name: 'readDoc',
      published: false,
      permissions: [{ refId: 'user1', type: PermissionType.USER, level: AccessLevels.READ }],
      permissions: [{ _id: 'user1', type: PermissionType.USER, level: AccessLevels.READ }],
      fixed: true,
    },
    {
      _id: writeDocId,
      name: 'writeDoc',
      permissions: [{ refId: 'user1', type: PermissionType.USER, level: AccessLevels.WRITE }],
      permissions: [{ _id: 'user1', type: PermissionType.USER, level: AccessLevels.WRITE }],
      fixed: true,
    },
    {
      _id: public1Id,
      name: 'public 1',
      published: true,
      fixed: true,
    },
    {
      _id: otherOwnerId,
      name: 'no shared with user',
      permissions: [{ refId: 'user2', type: PermissionType.USER, level: AccessLevels.WRITE }],
      permissions: [{ _id: 'user2', type: PermissionType.USER, level: AccessLevels.WRITE }],
      fixed: true,
    },
    {
      _id: testingDB.id(),
      name: 'no shared',
      fixed: true,
    },
    {
      _id: testingDB.id(),
      name: 'shared with group',
      permissions: [{ refId: 'group2', type: PermissionType.GROUP, level: AccessLevels.READ }],
      permissions: [{ _id: 'group2', type: PermissionType.GROUP, level: AccessLevels.READ }],
      fixed: true,
    },
    {
      _id: deleteDocId,
      name: 'docToDelete',
      permissions: [{ refId: 'user1', type: PermissionType.USER, level: AccessLevels.WRITE }],
      permissions: [{ _id: 'user1', type: PermissionType.USER, level: AccessLevels.WRITE }],
    },
    {
      _id: testingDB.id(),
      name: 'public 2',
      published: true,
      fixed: true,
    },
  ];
  beforeAll(async () => {
    connection = await testingDB.connect();
    model = instanceModel<TestDoc>('docs', testSchema);
    await connection.collection('docs').insertMany(testdocs);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  describe('logged user', () => {
    describe('collaborator user', () => {
      beforeAll(async () => {
        jest.spyOn(permissionsContext, 'getUserInContext').mockReturnValue({
          _id: 'user1',
          username: 'User 1',
          email: 'user@test.test',
          role: 'collaborator',
          groups: [
            { _id: 'group1', name: 'Group 1' },
            { _id: 'group2', name: 'Group 2' },
          ],
        });
      });

      describe('get', () => {
        let results: TestDoc[];
        beforeEach(async () => {
          results = await model.get({}, null, {});
          results = results.sort((a, b) => a.name!.localeCompare(b.name!));
        });
        it('should return entities shared with the user or his groups and public entities', () => {
          expect(results.length).toBe(6);

          expect(results[0].name).toBe('docToDelete');
          expect(results[1].name).toBe('public 1');
          expect(results[2].name).toBe('public 2');
          expect(results[3].name).toBe('readDoc');
          expect(results[4].name).toBe('shared with group');
          expect(results[5].name).toBe('writeDoc');
        });

        it('should exclude the permissions property from the non write allowed documents', () => {
          expect(results[0].permissions.length).toBe(1);
          expect(results[1].permissions).toBeUndefined();
          expect(results[2].permissions).toBeUndefined();
          expect(results[3].permissions).toBeUndefined();
          expect(results[4].permissions).toBeUndefined();
          expect(results[5].permissions.length).toBe(1);
        });
      });

      describe('getById', () => {
        it('should return a read only entity without permissions', async () => {
          const doc = await model.getById(readDocId, '+name');
          expect(doc.name).toBe('readDoc');
          expect(doc.permissions).toBeUndefined();
        });

        it('should not return a no shared entity', async () => {
          const doc = await model.getById(otherOwnerId, '+name');
          expect(doc).toBeNull();
        });

        it('should return null if there is no entity', async () => {
          const doc = await model.getById(testingDB.id());
          expect(doc).toBeNull();
        });
      });

      describe('save', () => {
        it('should save the data if user has permissions on the document', async () => {
          const saved = await model.save({
            _id: writeDocId.toString(),
            name: 'writeDocUpdated',
          });
          expect(saved.name).toEqual('writeDocUpdated');
        });

        it('should not save the data if user has not permissions on the document', async () => {
          try {
            await model.save({
              _id: readDocId.toString(),
              name: 'readDocUpdated',
            });
            fail('Should throw error');
          } catch (e) {
            expect(e.message).toContain('not updated');
          }
        });

        it('should add the user in the permissions property of the new doc', async () => {
          const saved = await model.save({ name: 'newDoc' });
          expect(saved).toEqual(
            expect.objectContaining({
              name: 'newDoc',
              permissions: [{ refId: 'user1', type: 'user', level: 'write' }],
            })
          );
        });

        it('should keep the existing permissions for a cloned entity with permissions ', async () => {
          const permissions = [
            { _id: 'user3', type: PermissionType.USER, level: AccessLevels.READ },
          ];
          const saved = await model.save({
            name: 'clonedDoc',
            permissions,
          });
          expect(saved).toEqual(
            expect.objectContaining({
              name: 'clonedDoc',
              permissions,
            })
          );
        });
      });

      describe('delete', () => {
        it('should delete document if user has permissions on it', async () => {
          const result = await model.delete({ _id: deleteDocId.toString() });
          expect(result.deletedCount).toBe(1);
        });
        it('should not delete document if user has not permissions on it', async () => {
          const result = await model.delete({ _id: otherOwnerId.toString() });
          expect(result.deletedCount).toBe(0);
        });
      });

      describe('getUnrestricted', () => {
        it('should return the matched documents no matter their permissions', async () => {
          const results = await model.getUnrestricted({ fixed: true });
          expect(results.length).toBe(7);
          expect(results[0].permissions.length).toBe(1);
        });
      });

      describe('count', () => {
        it('should return the count of entities shared with the user or his groups and public entities', async () => {
          const result = await model.count({ fixed: true });
          expect(result).toBe(5);
        });
      });
    });

    describe('admin & editor roles', () => {
      beforeAll(async () => {
        jest.spyOn(permissionsContext, 'getUserInContext').mockReturnValue({
          _id: 'admin1',
          username: 'Admin 1',
          email: 'admin@test.test',
          role: 'admin',
          groups: [{ _id: 'group2', name: 'Group 2' }],
        });
      });

      describe('get', () => {
        it('should return all matched documents with their permissions', async () => {
          const results = await model.get({ fixed: true }, null, {});
          expect(results.length).toBe(7);
          expect(results[0].permissions.length).toBe(1);
        });
      });

      describe('getById', () => {
        it('should return an entity with its permissions', async () => {
          const doc = await model.getById(otherOwnerId, '+name');
          expect(doc.name).toEqual('no shared with user');
          expect(doc.permissions.length).toBe(1);
        });
      });

      describe('count', () => {
        it('should return the count of all entities', async () => {
          const result = await model.count({ fixed: true });
          expect(result).toBe(7);
        });
      });
    });
  });

  describe('no logged user', () => {
    beforeAll(() => {
      jest.spyOn(permissionsContext, 'getUserInContext').mockReturnValue(undefined);
    });

    describe('write action', () => {
      it('should not save an existing doc', async () => {
        try {
          await model.save({ _id: writeDocId.toString(), name: 'writeDocUpdated' });
          fail('Should throw error');
        } catch (e) {
          expect(e.message).toContain('not updated');
        }
      });

      it('should create a new doc without permissions', async () => {
        const saved = await model.save({ name: 'newDoc' });
        expect(saved).toEqual(
          expect.objectContaining({
            name: 'newDoc',
            permissions: [],
          })
        );
      });
    });

    describe('read action', () => {
      it('should only return public documents', async () => {
        const results = await model.get();
        expect(results.length).toBe(2);
        expect(results[0].name).toEqual('public 1');
        expect(results[1].name).toEqual('public 2');
      });

      it('should return a public entity without permissions property', async () => {
        const doc = await model.getById(public1Id, '+name');
        expect(doc.name).toEqual('public 1');
        expect(doc.permissionsContext).toBeUndefined();
      });

      it('should not return a non public entity', async () => {
        const doc = await model.getById(readDocId, '+name');
        expect(doc).toBeNull();
      });
    });
  });
});
