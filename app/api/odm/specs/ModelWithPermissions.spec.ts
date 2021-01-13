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
    permissions: {
      type: 'array',
      items: permissionSchema,
    },
  });
  interface TestDoc {
    _id: string;
    value?: string;
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
        permissions: { $elemMatch: { _id: 'user1', level: 'write' } },
      });
    });
  });

  describe('get', () => {
    it('should add permissions filter to query', async () => {
      await model.get({ name: 'test' }, 'name', {});
      expect(OdmModel.prototype.get).toHaveBeenCalledWith(
        {
          name: 'test',
          permissions: { $elemMatch: { _id: 'user1', level: { $in: ['read', 'write'] } } },
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
        permissions: { $elemMatch: { _id: 'user1', level: 'write' } },
      });
    });
  });
});
