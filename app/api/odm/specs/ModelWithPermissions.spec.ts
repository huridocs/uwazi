import { instanceModel } from 'api/odm/ModelWithPermissions';
import mongoose from 'mongoose';
import { AccessLevels, permissionSchema, PermissionType } from 'shared/types/permissionSchema';
import { PermissionSchema } from 'shared/types/permissionType';
import { OdmModel } from 'api/odm/model';

jest.mock('api/odm/model');

jest.mock('api/permissions/permissionsContext', () => ({
  getUserInContext: jest.fn().mockReturnValue({ _id: 'user1' }),
}));

describe('ModelWithPermissions', () => {
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

  describe('save', () => {
    jest
      .spyOn(OdmModel.prototype, 'save')
      .mockImplementation(async (_data, query) => Promise.resolve(query));

    const model = instanceModel<TestDoc>('docs', testSchema);
    it('should add permissions filter to query', async () => {
      const doc = {
        _id: 'doc1',
        permissions: [{ _id: 'user1', level: AccessLevels.WRITE, type: PermissionType.USER }],
      };
      await model.save(doc);
      expect(OdmModel.prototype.save).toHaveBeenCalledWith(doc, {
        _id: 'doc1',
        permissions: { $elemMatch: { _id: 'user1', level: 'write' } },
      });
    });
  });
});
