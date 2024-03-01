/* eslint-disable max-statements */
import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers/login';

describe('Menu configuration', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn blank-state --force', { env });
    clearCookiesAndLogin('admin', 'change this password now');
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.injectAxe();
    cy.contains('span', 'Thesauri').click();
  });

  it('should have no detectable accessibility violations on load', () => {
    cy.checkA11y();
  });

  beforeEach(() => {
    cy.intercept('GET', '/api/dictionaries').as('fetchThesauri');
  });

  it('should add thesauri', () => {
    cy.contains('a', 'Add thesaurus').click();
    cy.get('#thesauri-name').type('New Thesauri');
    cy.contains('button', 'Add item').click();
    cy.get('#menu-form #item-name').type('First Item');
    cy.getByTestId('menu-form-submit').click();

    cy.contains('button', 'Add item').click();
    cy.get('#menu-form #item-name').type('Second Item');
    cy.getByTestId('menu-form-submit').click();

    cy.contains('button', 'Save').click();
    cy.wait('@fetchThesauri');
  });

  it('should add groups', () => {
    // cy.contains('a', 'Add thesaurus').click();
    // cy.contains('button', 'Edit').eq(0).click();
    cy.intercept('GET', '/api/stats').as('fetchStats');
    cy.contains('button', 'Add group').click();
    cy.get('#menu-form #group-name').type('First group');
    cy.getByTestId('menu-form-submit').click();

    cy.contains('button', 'Edit').eq(0).click();
    cy.wait('@fetchStats');

    cy.contains('button', 'Add item').click();
    cy.get('#menu-form #item-name').type('Inside first group');
    cy.get('#item-group').select('First group');
    cy.getByTestId('menu-form-submit').click();
    cy.wait('@fetchThesauri');
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
