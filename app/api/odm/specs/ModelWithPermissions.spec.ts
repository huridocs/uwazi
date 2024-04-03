import { PermissionSchema } from 'shared/types/permissionType';
import { AccessLevels, PermissionType } from 'shared/types/permissionSchema';
import { instanceModelWithPermissions, ModelWithPermissions } from 'api/odm/ModelWithPermissions';
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
    permissions: { type: mongoose.Schema.Types.Mixed, select: false },
    fixed: Boolean,
  });
  const readDocId = testingDB.id();
  const writeDocId = testingDB.id();
  const writeDoc2Id = testingDB.id();
  const deleteDocId = testingDB.id();
  const otherOwnerId = testingDB.id();
  const public1Id = testingDB.id();
  const public2Id = testingDB.id();
  const noSharedId = testingDB.id();
  const sharedWithGroupIdRead = testingDB.id();
  const sharedWithGroupIdWrite = testingDB.id();
  const testdocs = [
    {
      _id: readDocId,
      name: 'readDoc',
      published: false,
      permissions: [{ refId: 'user1', type: PermissionType.USER, level: AccessLevels.READ }],
      fixed: true,
    },
    {
      _id: writeDocId,
      name: 'writeDoc',
      permissions: [{ refId: 'user1', type: PermissionType.USER, level: AccessLevels.WRITE }],
      fixed: true,
    },
    {
      _id: writeDoc2Id,
      name: 'writeDoc2',
      permissions: [{ refId: 'user1', type: PermissionType.USER, level: AccessLevels.WRITE }],
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
      fixed: true,
    },
    {
      _id: noSharedId,
      name: 'no shared',
      fixed: true,
    },
    {
      _id: sharedWithGroupIdRead,
      name: 'shared with group',
      permissions: [{ refId: 'group2', type: PermissionType.GROUP, level: AccessLevels.READ }],
      fixed: true,
    },
    {
      _id: sharedWithGroupIdWrite,
      name: 'shared with group write',
      permissions: [{ refId: 'group2', type: PermissionType.GROUP, level: AccessLevels.WRITE }],
      fixed: true,
    },
    {
      _id: deleteDocId,
      name: 'docToDelete',
      permissions: [{ refId: 'user1', type: PermissionType.USER, level: AccessLevels.WRITE }],
    },
    {
      _id: public2Id,
      name: 'public 2',
      published: true,
      fixed: true,
    },
  ];
  beforeAll(async () => {
    connection = await testingDB.connect();
    model = instanceModelWithPermissions<TestDoc>('docs', testSchema);
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
        describe('+permissions', () => {
          let results: TestDoc[];
          beforeEach(async () => {
            results = await model.get({}, '+permissions', {});
            results = results.sort((a, b) => a.name!.localeCompare(b.name!));
          });

          it('should return entities shared with the user or his groups and public entities', () => {
            expect(results.length).toBe(8);
            expect(results[0].name).toBe('docToDelete');
            expect(results[1].name).toBe('public 1');
            expect(results[2].name).toBe('public 2');
            expect(results[3].name).toBe('readDoc');
            expect(results[4].name).toBe('shared with group');
            expect(results[5].name).toBe('shared with group write');
            expect(results[6].name).toBe('writeDoc');
            expect(results[7].name).toBe('writeDoc2');
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

        it('should filter permissions when they was asked with select', async () => {
          const results = await model.get({}, { permissions: 1 }, {});
          const docsWithPermissions = results.filter(doc => doc.permissions !== undefined);
          expect(docsWithPermissions.length).toBe(4);
        });

        it('should not include the permissions by default', async () => {
          const results = await model.get({}, null, {});
          results.forEach(result => {
            expect(result.permissions).toBeUndefined();
          });
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

        it('should exclude the permissions property from the non write allowed documents when asked for', async () => {
          const resultWithPermission = await model.getById(writeDocId, '+permissions');
          expect(resultWithPermission.permissions.length).toBe(1);

          const resultNoPermissions = await model.getById(readDocId, '+permissions');
          expect(resultNoPermissions.permissions).toBeUndefined();
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

        it('should not save the data if user has not permissions on a private document', async () => {
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

        it('should not save the data if user has not permissions on a public document', async () => {
          try {
            await model.save({
              _id: public1Id,
              name: 'update public',
            });
            fail('Should throw error');
          } catch (e) {
            expect(e.message).toContain('not updated');
          }
        });

        it('should save unrestricted even if user has not permissions on the document', async () => {
          const saved = await model.saveUnrestricted({
            _id: readDocId.toString(),
            name: 'readDocUpdated',
          });
          expect(saved.name).toEqual('readDocUpdated');
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
            { _id: 'user3', refId: 'refId', type: PermissionType.USER, level: AccessLevels.READ },
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

      describe('saveMultiple', () => {
        it('should save the data if user has permissions on the document', async () => {
          const saved = await model.saveMultiple([
            {
              _id: writeDocId.toString(),
              name: 'writeDocMultiUpdated',
            },
            {
              _id: writeDoc2Id.toString(),
              name: 'writeDoc2MultiUpdated',
            },
          ]);
          expect(saved[0].name).toEqual('writeDocMultiUpdated');
          expect(saved[1].name).toEqual('writeDoc2MultiUpdated');
        });

        it('should not save the data if user has not permissions on a private document', async () => {
          try {
            await model.saveMultiple([
              {
                _id: readDocId.toString(),
                name: 'readDocMultiUpdated',
              },
            ]);
            fail('Should throw error');
          } catch (e) {
            expect(e.message).toContain('not updated');
          }
        });

        it('should not save the data if user has not permissions on a public document', async () => {
          try {
            await model.saveMultiple([
              {
                _id: public1Id,
                name: 'update multiple public',
              },
            ]);
            fail('Should throw error');
          } catch (e) {
            expect(e.message).toContain('not updated');
          }
        });

        it('should add the user in the permissions property of the new doc', async () => {
          const saved = await model.saveMultiple([{ name: 'newDoc' }, { name: 'newDoc2' }]);
          expect(saved).toMatchObject([
            {
              name: 'newDoc',
              permissions: [{ refId: 'user1', type: 'user', level: 'write' }],
            },
            {
              name: 'newDoc2',
              permissions: [{ refId: 'user1', type: 'user', level: 'write' }],
            },
          ]);
        });

        it('should keep the existing permissions for a cloned entity with permissions ', async () => {
          const permissions = [
            { _id: 'user3', refId: 'refId', type: PermissionType.USER, level: AccessLevels.READ },
          ];
          const saved = await model.saveMultiple([
            {
              name: 'clonedMultipleDoc',
              permissions,
            },
            {
              name: 'clonedMultipleDoc2',
              permissions,
            },
          ]);
          expect(saved).toMatchObject([
            {
              name: 'clonedMultipleDoc',
              permissions,
            },
            {
              name: 'clonedMultipleDoc2',
              permissions,
            },
          ]);
        });

        it('should perform on mixed input correctly', async () => {
          const docsToSave = [
            {
              _id: readDocId,
              name: 'readDocMixedUpdate',
            },
            {
              _id: writeDocId,
              name: 'writeDocMixedUpdate',
            },
            {
              _id: public1Id,
              name: 'public 1 mixed update',
            },
            {
              _id: otherOwnerId,
              name: 'no shared with user mixed update',
            },
            {
              _id: noSharedId,
              name: 'no shared mixed update',
            },
            {
              _id: sharedWithGroupIdRead,
              name: 'shared with group mixed update',
            },
            {
              _id: sharedWithGroupIdWrite,
              name: 'shared with group write mixed update',
            },
            { name: 'new doc mixed' },
            {
              name: 'cloned doc mixed',
              permissions: [
                {
                  _id: 'user3',
                  refId: 'refId',
                  type: PermissionType.USER,
                  level: AccessLevels.READ,
                },
              ],
            },
          ];
          const expectedNames = [
            'readDocUpdated',
            'writeDocMixedUpdate',
            'writeDoc2MultiUpdated',
            'public 1',
            'no shared with user',
            'no shared',
            'shared with group',
            'shared with group write mixed update',
            'docToDelete',
            'public 2',
            'newDoc',
            'clonedDoc',
            'newDoc',
            'newDoc2',
            'clonedMultipleDoc',
            'clonedMultipleDoc2',
            'new doc mixed',
            'cloned doc mixed',
          ];
          try {
            await model.saveMultiple(docsToSave);
            fail('Should throw error');
          } catch (e) {
            expect(e.message).toContain('not updated');
          }
          const allNames = new Set((await model.getUnrestricted({})).map(d => d.name));
          expectedNames.forEach(name => expect(allNames).toContain(name));
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
          expect(results.length).toBe(9);
        });
      });

      describe('count', () => {
        it('should return the count of entities shared with the user or his groups and public entities', async () => {
          const result = await model.count({ fixed: true });
          expect(result).toBe(7);
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
          const results = await model.get({ fixed: true }, '+permissions', {});
          expect(results.length).toBe(9);
          expect(results[0].permissions.length).toBe(1);
        });
      });

      describe('getById', () => {
        it('should return an entity with its permissions', async () => {
          const doc = await model.getById(otherOwnerId, '+name +permissions');
          expect(doc.name).toEqual('no shared with user');
          expect(doc.permissions.length).toBe(1);
        });
      });

      describe('count', () => {
        it('should return the count of all entities', async () => {
          const result = await model.count({ fixed: true });
          expect(result).toBe(9);
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

      it('should not save multiple existing docs', async () => {
        try {
          await model.saveMultiple([
            { _id: writeDocId.toString(), name: 'writeDocUpdated' },
            { _id: writeDoc2Id.toString(), name: 'writeDoc2Updated' },
          ]);
          fail('Should throw error');
        } catch (e) {
          expect(e.message).toContain('not updated');
        }
      });

      it('should create multiple new docs without permissions', async () => {
        const saved = await model.saveMultiple([{ name: 'newDoc' }, { name: 'newDoc2' }]);
        expect(saved).toMatchObject([
          {
            name: 'newDoc',
          },
          {
            name: 'newDoc2',
          },
        ]);
        saved.forEach(item => {
          expect(item.permissions).toBe(undefined);
        });
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
