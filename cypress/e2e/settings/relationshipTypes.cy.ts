/* eslint-disable max-statements */
import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers/login';

describe('Relationship Types configuration', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn blank-state --force', { env });
    clearCookiesAndLogin('admin', 'change this password now');
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.injectAxe();
    cy.contains('span', 'Menu').click();
  });

  it('should have no detectable accessibility violations on load', () => {
    cy.checkA11y();
  });

  beforeEach(() => {
    cy.intercept('GET', 'api/relatiuonshiptypes').as('fetchTypes');
  });

  it('tests add links', () => {
    cy.getByTestId('menu-add-link').click();
    cy.get('#link-title').click();
    cy.get('#link-title').type('Link 1');
    cy.get('#link-url').type('www.example.com');
    cy.getByTestId('menu-form-submit').click();

    cy.getByTestId('menu-add-link').click();
    cy.get('#link-title').click();
    cy.get('#link-title').type('Link 2');
    cy.get('#link-url').click();
    cy.get('#link-url').type('www.example.com');
    cy.getByTestId('menu-form-submit').click();

    cy.getByTestId('menu-add-link').click();
    cy.getByTestId('menu-form-cancel').click();

    cy.getByTestId('menu-add-link').click();
    cy.get('#link-title').click();
    cy.get('#link-title').type('Link 3');
    cy.get('#link-url').type('www.exmple.com');
    cy.getByTestId('menu-form-submit').click();

    cy.getByTestId('menu-save').click();
    cy.contains('Dismiss').click();
    cy.wait('@fetchLinks');
  });

  it('tests Add groups', () => {
    cy.getByTestId('menu-add-group').click();
    cy.get('#link-title').click();
    cy.get('#link-title').type('Group 1');
    cy.get("[data-testid='menu-form-submit'] > span").click();
    cy.getByTestId('menu-add-group').click();
    cy.get('#link-title').click();
    cy.get('#link-title').type('Group 2');
    cy.getByTestId('menu-form-submit').click();
    cy.getByTestId('menu-save').click();
    cy.contains('Dismiss').click();
    cy.wait('@fetchLinks');
  });

  it('tests Edit', () => {
    cy.get('tbody tr:nth-of-type(1)').contains('Edit').click();
    cy.get('#link-title').type(' edited');
    cy.get('#link-group').select('Group 1');
    cy.getByTestId('menu-form-submit').click();
    cy.get('tbody td:nth-of-type(2) button span').click();
    cy.get('tbody tr:nth-of-type(2) button').click();
    cy.get('#link-group').select('Group 2');
    cy.getByTestId('menu-form-submit').click();
    cy.getByTestId('menu-save').click();
    cy.contains('Dismiss').click();
    cy.wait('@fetchLinks');
  });

  it('tests edit groups', () => {
    cy.get('tbody tr:nth-of-type(2)').contains('button', 'Group').click();
    cy.get('tbody tr:nth-of-type(3)').contains('Edit').click();
    cy.get('#link-group').select('Group 2');
    cy.getByTestId('menu-form-submit').click();

    cy.get('tbody tr:nth-of-type(4)').contains('Edit').click();
    cy.get('#link-group').select('Group 1');
    cy.getByTestId('menu-form-submit').click();

    cy.getByTestId('menu-save').click();
    cy.contains('Dismiss').click();
    cy.wait('@fetchLinks');
  });

  it('should update the navigation bar with the changes', () => {
    cy.get('.menuItems > .menuNav-list > .menuNav-item')
      .should('have.length', 3)
      .then($els => Cypress.$.makeArray($els).map(el => el.innerText))
      .should('deep.equal', ['Link 2', 'Group 1  ', 'Group 2  ']);

    cy.get('.menuItems > .menuNav-list > .menuNav-item').eq(2).click();
    cy.get('.dropdown-menu.expanded').contains('Link 1 edited');
  });

  it('tests delete', () => {
    cy.get('tbody tr:nth-of-type(1) input').click();

    cy.get('tbody tr:nth-of-type(3) input').click();
    cy.getByTestId('menu-delete-link').click();

    cy.getByTestId('menu-save').click();
    cy.contains('Dismiss').click();
    cy.wait('@fetchLinks');
  });
});
