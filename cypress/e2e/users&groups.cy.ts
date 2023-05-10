import 'cypress-axe';

describe('Users and groups', () => {
  describe('Users', () => {});
  it('create user');
  it('edit user');
  it('delete user');
  it('reset password');
  it('disable 2fa');
  it('check for unique name and email');

  describe('bulk actions', () => {
    it('bulk delete');
    it('bulk password reset');
    it('bulk reset 2FA');
  });
});
