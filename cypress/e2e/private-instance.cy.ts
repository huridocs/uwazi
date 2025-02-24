/* eslint-disable max-lines */
/* eslint-disable max-statements */
import { clearCookiesAndLogin } from './helpers/login';

describe('Private instance', () => {
  before(() => {
    cy.blankState();
    cy.clearAllCookies();
  });

  it('should be redirected to the login screen by default', () => {
    cy.visit('http://localhost:3000');
    cy.contains('Login');
    cy.location('pathname').should('eq', '/login');
  });

  it('should login an be able to see the library', () => {
    clearCookiesAndLogin('admin', 'change this password now');
    cy.contains('.blank-state', 'Welcome to Uwazi');
  });

  it('should navigate to the settings and make the instance public', () => {
    cy.contains('a', 'Settings').realClick();
    cy.contains('a', 'Collection').realClick();
    cy.contains('div', 'Public instance').within(() => {
      cy.get('input[type="checkbox"]').check({ force: true });
      cy.contains('div', 'Disable');
    });
    cy.contains('button', 'Save').realClick();
    cy.contains('div', 'Settings updated.');
    cy.contains('button', 'Dismiss').realClick();
  });

  it('should logout and still be able to see the library', () => {
    // UWAZI homepage has some errors on the console when there are not entities.
    // This errors have no impact on the user and it's not withing the scope of this PR to fix them
    cy.on('uncaught:exception', () => false);

    cy.contains('a', 'Account').click();
    cy.get('[data-testid="settings-account"]').within(() => {
      cy.contains('a', 'Logout').realClick();
    });
    cy.contains('.blank-state', 'Welcome to Uwazi');
    cy.contains('div.sidepanel-title', 'Filters');
  });
});
