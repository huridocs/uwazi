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

  it('should add links', () => {
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

  it('should not show the unsaved changes alert', () => {
    cy.contains('a', 'Account').click();
    cy.contains('a', 'Menu').click();
    cy.contains('caption', 'Menu');
  });

  it('it should add groups', () => {
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

  it('should edit items and put them into groups', () => {
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

  it('should save the edited links', () => {
    cy.getByTestId('menu-save').click();
    cy.contains('Dismiss').click();
    cy.wait('@fetchLinks');
    cy.getByTestId('menu-save').should('be.disabled');
  });

  it('should swich items from groups', () => {
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

  it('should edit a child item', () => {
    cy.contains('tr', 'Link 1 edited').contains('button', 'Edit').click();
    cy.get('aside').within(() => {
      cy.get('#link-title').clear();
      cy.get('#link-title').type('Link A', { delay: 0 });
      cy.contains('button', 'Update').click();
    });
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
    cy.get('.dropdown-menu.expanded').contains('Link A');
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
        cy.contains('Link A');
      });
    });
  });

  it('should add a single child', () => {
    cy.contains('button', 'Add link').click();
    cy.get('#link-title').click();
    cy.get('#link-title').type('Child 1', { delay: 0 });
    cy.get('#link-url').type('www.subrow.com', { delay: 0 });
    cy.get('#link-group').select('Group 1');
    cy.getByTestId('menu-form-submit').click();
    cy.contains('button', 'Save').click();
  });
});
