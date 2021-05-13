import { permissionsContext } from 'api/permissions/permissionsContext';
import { UserSchema } from 'shared/types/userType';
import { UserRole } from 'shared/types/userSchema';

export class UserInContextMockFactory {
  spy: jest.SpyInstance | undefined;

  mock(user?: UserSchema) {
    this.spy = jest.spyOn(permissionsContext, 'getUserInContext').mockReturnValue(user);
  }

  mockEditorUser() {
    const editorUser = {
      _id: 'userId',
      role: UserRole.EDITOR,
      username: 'editorUser',
      email: 'editor@test.com',
    };
    this.spy = jest.spyOn(permissionsContext, 'getUserInContext').mockReturnValue(editorUser);
  }

  restore() {
    this.spy?.mockRestore();
  }
}
