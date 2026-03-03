import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { UserSchema } from '#shared/types/userType.js';
import { UserRole } from '#shared/types/userSchema.js';
import { DataType } from '#api/odm/index.js';
import { ObjectId } from 'mongodb';

export class UserInContextMockFactory {
  spy: jest.SpyInstance | undefined;

  mock(user?: DataType<UserSchema>) {
    this.spy = jest.spyOn(permissionsContext, 'getUserInContext').mockReturnValue(user);
  }

  mockEditorUser() {
    const user = {
      _id: new ObjectId(),
      role: UserRole.EDITOR,
      username: 'editorUser',
      email: 'editor@test.com',
    };
    this.mock(user);
    return user;
  }

  restore() {
    this.spy?.mockRestore();
  }
}
