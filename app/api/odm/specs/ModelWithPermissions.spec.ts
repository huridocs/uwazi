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
  });
  const readDocId = testingDB.id();
  const writeDocId = testingDB.id();
  const deleteDocId = testingDB.id();
  const otherOwnerId = testingDB.id();
  const testdocs = [
    {
      _id: readDocId,
      name: 'readDoc',
      published: false,
      permissions: [{ _id: 'user1', type: PermissionType.USER, level: AccessLevels.READ }],
    },
    {
      _id: writeDocId,
      name: 'writeDoc',
      permissions: [{ _id: 'user1', type: PermissionType.USER, level: AccessLevels.WRITE }],
    },
    {
      _id: testingDB.id(),
      name: 'public 1',
      published: true,
    },
    {
      _id: otherOwnerId,
      name: 'no shared with user',
      permissions: [{ _id: 'user2', type: PermissionType.USER, level: AccessLevels.WRITE }],
    },
    {
      _id: testingDB.id(),
      name: 'no shared',
      published: false,
    },
    {
      _id: testingDB.id(),
      name: 'shared with group',
      permissions: [{ _id: 'group2', type: PermissionType.GROUP, level: AccessLevels.READ }],
    },
    {
      _id: deleteDocId,
      name: 'docToDelete',
      permissions: [{ _id: 'user1', type: PermissionType.USER, level: AccessLevels.WRITE }],
    },
    {
      _id: testingDB.id(),
      name: 'public 2',
      published: true,
    },
  ];
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
    connection = await testingDB.connect();
    model = instanceModel<TestDoc>('docs', testSchema);
    await connection.collection('docs').insertMany(testdocs);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  describe('logged user', () => {
    describe('collaborator user', () => {
      describe('get', () => {
        it('should return entities shared with the user or his groups and public entities', async () => {
          const results: TestDoc[] = await model.get({}, 'name', {});
          expect(results.length).toBe(6);
          const names = results.map(r => r.name!).sort((a, b) => a.localeCompare(b));
          expect(names[0]).toBe('docToDelete');
          expect(names[1]).toBe('public 1');
          expect(names[2]).toBe('public 2');
          expect(names[3]).toBe('readDoc');
          expect(names[4]).toBe('shared with group');
          expect(names[5]).toBe('writeDoc');
        });
      });

      describe('save', () => {
        it('should save the data if user has permissions on the document', async () => {
          const saved = await model.save({ _id: writeDocId.toString(), name: 'writeDocUpdated' });
          expect(saved.name).toEqual('writeDocUpdated');
        });

        it('should not save the data if user has not permissions on the document', async () => {
          try {
            await model.save({ _id: readDocId.toString(), name: 'readDocUpdated' });
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
              permissions: [{ _id: 'user1', type: 'user', level: 'write' }],
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
    });
  });

  describe('no logged user', () => {
    beforeAll(() => {
      // @ts-ignore
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

      it('should not create a new doc', async () => {
        try {
          await model.save({ name: 'new document' });
          fail('Should throw error');
        } catch (e) {
          expect(e.message).toContain('Unauthorized');
        }
      });
    });

    describe('read action', () => {
      it('should only return public documents', async () => {
        const results = await model.get();
        expect(results.length).toBe(2);
        expect(results[0].name).toEqual('public 1');
        expect(results[1].name).toEqual('public 2');
      });
    });
  });
});
