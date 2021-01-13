import { instanceModel, ModelWithPermissions } from 'api/odm/ModelWithPermissions';
import mongoose from 'mongoose';
import { AccessLevels, permissionSchema, PermissionType } from 'shared/types/permissionSchema';
import { PermissionSchema } from 'shared/types/permissionType';
import { OdmModel } from 'api/odm/model';

jest.mock('api/odm/model');

jest.mock('api/permissions/permissionsContext', () => ({
  getUserInContext: jest.fn().mockReturnValue({ _id: 'user1' }),
}));

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
  describe('save', () => {
    it('should add permissions filter to query', async () => {
      await model.save(doc);
      expect(OdmModel.prototype.save).toHaveBeenCalledWith(doc, {
        _id: 'doc1',
        permissions: { $elemMatch: { _id: { $in: ['user1'] }, level: 'write' } },
      });
    });

    it('should not add permissions filter if it is a new doc', async () => {
      const newDoc = { name: 'newDoc' };
      await model.save(newDoc);
      expect(OdmModel.prototype.save).toHaveBeenCalledWith(
        {
          name: 'newDoc',
        },
        {}
      );
    });
  });

  describe('get', () => {
    it('should add permissions filter to query', async () => {
      await model.get({ name: 'test' }, 'name', {});
      expect(OdmModel.prototype.get).toHaveBeenCalledWith(
        {
          name: 'test',
          permissions: {
            $elemMatch: { _id: { $in: ['user1'] } },
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
        permissions: { $elemMatch: { _id: { $in: ['user1'] }, level: 'write' } },
      });
    });
  });
});
