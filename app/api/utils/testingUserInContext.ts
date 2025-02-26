import { permissionsContext } from 'api/permissions/permissionsContext';
import { UserSchema } from 'shared/types/userType';
import { UserRole } from 'shared/types/userSchema';
import { DataType } from 'api/odm';
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
