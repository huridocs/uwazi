import { clearCookiesAndLogin } from '../helpers/index.js';
import 'cypress-axe';

describe('Settings mobile menu', { viewportWidth: 384, viewportHeight: 768 }, () => {
  before(() => {
    cy.blankState();
 });

  it('should login', () => {
    clearCookiesAndLogin('admin', 'change this password now');
 });

  it('should only show the menu', () => {
    cy.contains('Welcome to Uwazi').should('be.visible');
    cy.get('.menu-button').click();
    cy.contains('.only-mobile a', 'Settings').click();
    cy.location().should(location => {
      expect(location.pathname).to.contain('settings');
   });
    cy.get('[data-testid="settings-content"]').should('not.exist');
 });

  it('should enter the account settings', () => {
    cy.intercept('api/user').as('getUser');
    cy.contains('a', 'Account').click();
    cy.wait('@getUser');
    cy.get('[data-testid="settings-content"]').should('exist');
 });

  it('should go back to the menu', () => {
    cy.contains('a', 'Navigate back').click();
    cy.get('[data-testid="settings-content"]').should('not.exist');
 });
});
