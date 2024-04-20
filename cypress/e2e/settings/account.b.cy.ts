import { authenticator } from 'otplib';
import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers/login';

describe('Account', () => {
  before(() => {
    clearCookiesAndLogin('admin', 'change this password now');
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.injectAxe();

    cy.wrap(
      Cypress.automation('remote:debugger:protocol', {
        command: 'Browser.grantPermissions',
        params: {
          permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
          origin: window.location.origin,
        },
      })
    );
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
      cy.getByTestId('account-logout').click();
      cy.get('input[name=username]').type('admin');
      cy.get('input[name=password]').type('1234');
      cy.contains('button', 'Login').click();
      cy.get('.only-desktop a[aria-label="Settings"]').click();
      cy.injectAxe();
    });
  });

  describe('Enable 2FA', () => {
    let secret: string;

    it('pass accessibility tests', () => {
      cy.contains('button', 'Enable').click();
      cy.checkA11y();
    });

    it('should enable 2FA', () => {
      cy.getByTestId('copy-value-button').click();
      cy.window()
        .then(async win => win.navigator.clipboard.readText())
        .then(value => {
          secret = value;
          const token = authenticator.generate(value);
          cy.get('input[name=token]').type(token);
          cy.contains('aside button', 'Enable').click();
          cy.contains('Activated');
          cy.contains('Dismiss').click();
        });
    });

    it('should login with 2FA', () => {
      cy.getByTestId('account-logout').click();
      cy.get('input[name=username]').type('admin');
      cy.get('input[name=password]').type('1234');
      cy.contains('button', 'Login').click();
      cy.get('input[name=token]').type(authenticator.generate(secret));
      cy.contains('button', 'Verify').click();
    });
  });
});
