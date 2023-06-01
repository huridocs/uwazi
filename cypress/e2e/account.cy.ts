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

  it('should have no detectable accessibility violations on load', () => {
    cy.contains('Account');
    cy.checkA11y();
  });

  describe('Update user', () => {
    it('should change the password to a new one', () => {
      cy.get('input[name=email]').type('admin@uwazi.io');
      cy.get('input[name=password]').type('1234');
      cy.get('input[name=passwordConfirm]').type('123');
      cy.contains('button', 'Update').click();
      cy.contains('Passwords do not match');
      cy.get('input[name=passwordConfirm]').type('4');

      cy.intercept('POST', '/api/users').as('updateUser');
      cy.contains('Update').click();
      cy.wait('@updateUser');
      cy.contains('Dismiss').click();
    });

    it('should login with the new password', () => {
      cy.get('[data-testid="account-logout"]').click();
      cy.get('input[name=username]').type('admin');
      cy.get('input[name=password]').type('1234');
      cy.contains('button', 'Login').click();
    });
  });

  describe('Enable 2FA', () => {
    it('should enable 2FA', () => {
      cy.get('[data-testid="open-2fa"]').click();
      cy.contains('button', 'Enable').click();
      cy.contains('button', 'Disable');
    }
  });
});
