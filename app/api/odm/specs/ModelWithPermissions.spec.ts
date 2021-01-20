import { instanceModel, ModelWithPermissions } from 'api/odm/ModelWithPermissions';
import mongoose from 'mongoose';
import { AccessLevels, permissionSchema, PermissionType } from 'shared/types/permissionSchema';
import { PermissionSchema } from 'shared/types/permissionType';
import { OdmModel } from 'api/odm/model';
import * as permissionsContext from 'api/permissions/permissionsContext';

jest.mock('api/odm/model');

describe('ModelWithPermissions', () => {
  let model: ModelWithPermissions<any>;
  const testSchema = new mongoose.Schema({
    _id: String,
    name: String,
    permissions: {
      type: 'array',
      items: permissionSchema,
    },
  });
  interface TestDoc {
    _id: string;
    name?: string;
    permissions: PermissionSchema[];
  }
  const doc = {
    _id: 'doc1',
    permissions: [{ _id: 'user1', level: AccessLevels.WRITE, type: PermissionType.USER }],
  };

  beforeAll(() => {
    model = instanceModel<TestDoc>('docs', testSchema);
  });

  describe('logged user', () => {
    describe('collaborator user', () => {
      beforeAll(() => {
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

      describe('save', () => {
        it('should add permissions filter to query', async () => {
          await model.save(doc);
          expect(OdmModel.prototype.save).toHaveBeenCalledWith(doc, {
            _id: 'doc1',
            permissions: {
              $elemMatch: { _id: { $in: ['group1', 'group2', 'user1'] }, level: 'write' },
            },
          });
        });

        it('should add the user in the permissions property of the new doc', async () => {
          const newDoc = { name: 'newDoc' };
          await model.save(newDoc);
          expect(OdmModel.prototype.save).toHaveBeenCalledWith({
            name: 'newDoc',
            permissions: [{ _id: 'user1', level: AccessLevels.WRITE, type: PermissionType.USER }],
          });
        });
      });

      describe('get', () => {
        it('should add permissions filter to query', async () => {
          await model.get({ name: 'test' }, 'name', {});
          expect(OdmModel.prototype.get).toHaveBeenCalledWith(
            {
              name: 'test',
              permissions: {
                $elemMatch: { _id: { $in: ['group1', 'group2', 'user1'] } },
              },
            },
            'name',
            {}
          );
        });
      });

      describe('delete', () => {
        it('should add permissions filter to query', async () => {
          await model.delete({ _id: 'doc1' });
          expect(OdmModel.prototype.delete).toHaveBeenCalledWith({
            _id: 'doc1',
            permissions: {
              $elemMatch: { _id: { $in: ['group1', 'group2', 'user1'] }, level: 'write' },
            },
          });
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
      it('should add an always false condition for existing doc', async () => {
        await model.save(doc);
        expect(OdmModel.prototype.save).toHaveBeenCalledWith(doc, { _id: null });
      });

      it('should add an always false condition for new doc', async () => {
        await model.save({ name: 'newDoc' });
        expect(OdmModel.prototype.save).toHaveBeenCalledWith({});
      });
    });

    describe('read action', () => {
      it('should add condition for only public docs', async () => {
        await model.get();
        expect(OdmModel.prototype.get).toHaveBeenCalledWith({ published: true }, '', {});
      });
    });
  });
});
