import 'cypress-axe';

describe('Users and groups', () => {
  describe('Users', () => {
    it('should be sorted by name by default');
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

  describe('Groups', () => {
    it('should be sorted by name by default');
    it('create group');
    it('edit group');
    it('delete group');
    it('check for unique name');
  });
});
