import { clearCookiesAndLogin } from './helpers/login';
import 'cypress-axe';

describe('Public Form', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn blank-state', { env });
    clearCookiesAndLogin('admin', 'change this password now');
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.injectAxe();
  });

  describe('Update user', () => {
    it('should change the password to a new one', () => {
      cy.get('input[name=email]').type('admin@uwazi.io');
      cy.get('input[name=password]').type('1234');
      cy.get('input[name=passwordConfirm]').type('123');
      cy.contains('button', 'Update').click();
      cy.contains('Passwords do not match');
      cy.get('input[name=passwordConfirm]').type('4');
      cy.contains('button', 'Update').click();
    });
  });
});
