import { authenticator } from 'otplib';
import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers/login';

describe('Account', () => {
  before(() => {
    cy.blankState();
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
    it('should validate user has email', () => {
      cy.contains('button', 'Update').should('be.disabled');
      cy.get('input[name=email]').type('wrong.com');
      cy.contains('button', 'Update').click();
      cy.contains('A valid email is required');
      cy.get('input[name=email]').clear();
      cy.get('input[name=email]').type('admin@uwazi.io', { delay: 0 });
    });

    it('should validate passwords match', () => {
      cy.get('input[name=password]').type('1234', { delay: 0 });
      cy.get('input[name=passwordConfirm]').type('123', { delay: 0 });
      cy.contains('button', 'Update').click();
      cy.contains('Passwords do not match');
      cy.get('input[name=passwordConfirm]').type('4');
    });

    it('should save the changes', () => {
      cy.intercept('POST', '/api/users').as('updateUser');
      cy.contains('Update').click();

      cy.get('[data-testid="modal"]').within(() => {
        cy.contains('Confirm');
        cy.get('input').type('change this password now');
        cy.contains('button', 'Accept').click();
      });

      cy.wait('@updateUser');
      cy.contains('Dismiss').click();
      cy.get('input[name=email]').should('contain.value', 'admin@uwazi.io');
    });

    it('should not save changes when the password is wrong', () => {
      cy.get('input[name=password]').type('12345', { delay: 0 });
      cy.get('input[name=passwordConfirm]').type('12345', { delay: 0 });
      cy.get('input[name=email]').clear();
      cy.get('input[name=email]').type('admin@uwazi.io.com', { delay: 0 });
      cy.contains('button', 'Update').click();

      cy.get('[data-testid="modal"]').within(() => {
        cy.contains('Confirm');
        cy.get('input').type('wrong pass');
        cy.contains('button', 'Accept').click();
      });

      cy.get('input[name=email]').should('contain.value', 'admin@uwazi.io.com');
      cy.get('input[name=password]').should('not.contain.value');
      cy.get('input[name=passwordConfirm]').should('not.contain.value');
    });

    it('should check the error and dismiss the notification', () => {
      cy.contains('An error occurred');
      cy.contains('button', 'View more').click();
      cy.contains('Request failed with status code 403: Forbidden');
      cy.contains('button', 'Dismiss').click();
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
      cy.get('#account-form').within(() => {
        cy.contains('button', 'Enable').click({ force: true });
      });
      cy.contains('Using Authenticator');
      cy.checkA11y();
    });

    it('should enable 2FA', () => {
      cy.getByTestId('copy-value-button').focus({ timeout: 5000 });
      cy.getByTestId('copy-value-button').realClick();
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
