import { permissionsContext } from 'api/permissions/permissionsContext';
import { UserInContextMockFactory } from '../../utils/testingUserInContext';
import { UserSchema } from '../../../shared/types/userType';

describe('UserInContextMockFactory', () => {
  const user: UserSchema = {
    _id: 'id',
    username: 'username',
    role: 'admin',
    email: 'email',
  };

  it('should be instantiable', () => {
    const factory = new UserInContextMockFactory();
    expect(factory).toBeInstanceOf(UserInContextMockFactory);
  });

  it('should mock the getUserInContext function to return user', () => {
    const factory = new UserInContextMockFactory();
    factory.mock(user);
    expect(permissionsContext.getUserInContext()).toBe(user);
    expect(factory.spy).toHaveBeenCalled();
  });

  it('should restore the original implementation', () => {
    const factory = new UserInContextMockFactory();
    factory.mock(user);
    factory.restore();
    expect(() => {
      permissionsContext.getUserInContext();
    }).toThrow(expect.objectContaining({ message: expect.stringContaining('context') }));
  });
});
