/* eslint-disable max-statements */
import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers/login';

describe('Menu configuration', () => {
  before(() => {
    cy.blankState();
    clearCookiesAndLogin('admin', 'change this password now');
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.injectAxe();
    cy.contains('span', 'Menu').click();
  });

  beforeEach(() => {
    cy.intercept('GET', 'api/settings/links').as('fetchLinks');
  });

  it('tests add links', () => {
    cy.getByTestId('menu-add-link').click();
    cy.get('#link-title').click();
    cy.get('#link-title').type('Link 1', { delay: 0 });
    cy.get('#link-url').type('www.example.com', { delay: 0 });
    cy.getByTestId('menu-form-submit').click();

    cy.getByTestId('menu-add-link').click();
    cy.get('#link-title').click();
    cy.get('#link-title').type('Link 2', { delay: 0 });
    cy.get('#link-url').click();
    cy.get('#link-url').type('www.example.com', { delay: 0 });
    cy.getByTestId('menu-form-submit').click();

    cy.getByTestId('menu-add-link').click();
    cy.getByTestId('menu-form-cancel').click();

    cy.getByTestId('menu-add-link').click();
    cy.get('#link-title').click();
    cy.get('#link-title').type('Link 3', { delay: 0 });
    cy.get('#link-url').type('www.exmple.com', { delay: 0 });
    cy.getByTestId('menu-form-submit').click();
  });

  it('should alert users of unsaved changes', () => {
    cy.contains('a', 'Account').click();
    cy.get('[data-testid="modal"]').within(() => {
      cy.contains('You have unsaved changes. Do you want to continue?');
      cy.contains('button', 'Cancel').click();
    });
  });

  it('should save', () => {
    cy.getByTestId('menu-save').click();
    cy.contains('Dismiss').click();
    cy.wait('@fetchLinks');
    cy.getByTestId('menu-save').should('be.disabled');
  });

  it('should not should the unsaved changes alert', () => {
    cy.contains('a', 'Account').click();
    cy.contains('a', 'Menu').click();
    cy.contains('caption', 'Menu');
  });

  it('tests Add groups', () => {
    cy.getByTestId('menu-add-group').click();
    cy.get('#link-title').click();
    cy.get('#link-title').type('Group 1', { delay: 0 });
    cy.get("[data-testid='menu-form-submit'] > span").click();
    cy.getByTestId('menu-add-group').click();
    cy.get('#link-title').click();
    cy.get('#link-title').type('Group 2', { delay: 0 });
    cy.getByTestId('menu-form-submit').click();
    cy.getByTestId('menu-save').click();
    cy.contains('Dismiss').click();
    cy.wait('@fetchLinks');
  });

  it('tests Edit', () => {
    cy.get('tbody tr:nth-of-type(1)').contains('Edit').click();
    cy.get('#link-title').type(' edited', { delay: 0 });
    cy.get('#link-group').select('Group 1');
    cy.getByTestId('menu-form-submit').click();
    cy.get('tbody tr:nth-of-type(1)').contains('Edit').click();
    cy.get('#link-title').type(' edited', { delay: 0 });
    cy.get('#link-group').select('Group 2');
    cy.getByTestId('menu-form-submit').click();
  });

  it('should alert users of unsaved changes after editing', () => {
    cy.contains('a', 'Account').click();
    cy.get('[data-testid="modal"]').within(() => {
      cy.contains('You have unsaved changes. Do you want to continue?');
      cy.contains('button', 'Cancel').click();
    });
  });

  it('should save the editied links', () => {
    cy.getByTestId('menu-save').click();
    cy.contains('Dismiss').click();
    cy.wait('@fetchLinks');
    cy.getByTestId('menu-save').should('be.disabled');
  });

  it('tests edit groups', () => {
    cy.get('tbody tr:nth-of-type(3)').contains('button', 'Group').click();
    cy.get('tbody tr:nth-of-type(2)').contains('button', 'Group').click();

    cy.get('tbody tr:nth-of-type(3)').contains('Edit').click();
    cy.get('#link-group').select('Group 2');
    cy.getByTestId('menu-form-submit').click();

    cy.get('tbody tr:nth-of-type(5)').contains('Edit').click();
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
      .should('deep.equal', ['Link 3', 'Group 1  ', 'Group 2  ']);

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

  it('should have no detectable accessibility violations on load', () => {
    cy.checkA11y();
  });

  it('should verify the changes impacted on the navigation bar', () => {
    cy.get('.menuItems > .menuNav-list').within(() => {
      cy.contains('Group 1').click();
      cy.get('.dropdown-menu.expanded').should('be.empty');
      cy.contains('Group 2').click();
      cy.get('.dropdown-menu.expanded').within(() => {
        cy.contains('Link 1 edited');
      });
    });
  });
});
