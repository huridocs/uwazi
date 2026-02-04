import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { UserInContextMockFactory } from '#api/utils/testingUserInContext.js';
import { UserSchema } from '#shared/types/userType.js';
import { UserRole } from '#shared/types/userSchema.js';

describe('UserInContextMockFactory', () => {
  const user: UserSchema = {
    _id: 'id',
    username: 'username',
    role: 'admin',
    email: 'email',
  };
  let factory: UserInContextMockFactory;

  beforeAll(() => {
    factory = new UserInContextMockFactory();
  });

  it('should mock the getUserInContext function to return user', () => {
    factory.mock(user);
    expect(permissionsContext.getUserInContext()).toBe(user);
    expect(factory.spy).toHaveBeenCalled();
  });

  it('should restore the original implementation', () => {
    factory.mock(user);
    factory.restore();
    expect(() => {
      permissionsContext.getUserInContext();
    }).toThrow(expect.objectContaining({ message: expect.stringContaining('context') }));
  });

  describe('mockEditorUser', () => {
    it('should mock the getUserInContext function to return an editor user', () => {
      factory.mockEditorUser();
      const editor = permissionsContext.getUserInContext();
      expect(editor?.role).toBe(UserRole.EDITOR);
      expect(factory.spy).toHaveBeenCalled();
    });
  });
});
