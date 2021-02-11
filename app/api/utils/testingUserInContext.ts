import { permissionsContext } from 'api/permissions/permissionsContext';
import { UserSchema } from '../../shared/types/userType';

export class UserInContextMockFactory {
  spy: jest.SpyInstance | undefined;

  mock(user?: UserSchema) {
    this.spy = jest.spyOn(permissionsContext, 'getUserInContext').mockReturnValue(user);
  }

  restore() {
    this.spy?.mockRestore();
  }
}
