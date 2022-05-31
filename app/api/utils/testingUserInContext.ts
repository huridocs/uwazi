import { permissionsContext } from 'api/permissions/permissionsContext';
import { UserSchema } from 'shared/types/userType';
import { UserRole } from 'shared/types/userSchema';
import { DataType } from 'api/odm';

export class UserInContextMockFactory {
  spy: jest.SpyInstance | undefined;

  mock(user?: DataType<UserSchema>) {
    this.spy = jest.spyOn(permissionsContext, 'getUserInContext').mockReturnValue(user);
  }

  mockEditorUser() {
    this.mock({
      _id: 'userId',
      role: UserRole.EDITOR,
      username: 'editorUser',
      email: 'editor@test.com',
    });
  }

  restore() {
    this.spy?.mockRestore();
  }
}
