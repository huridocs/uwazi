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
    cy.get('input#item-name').type('First Item');
    cy.getByTestId('menu-form-submit').click();

    cy.contains('button', 'Add item').click();
    cy.get('input#item-name').type('Second Item');
    cy.getByTestId('menu-form-submit').click();

    cy.contains('button', 'Save').click();
    cy.wait('@fetchThesauri');
  });

  it('should add groups', () => {
    cy.contains('a', 'Add thesaurus').click();
    cy.get('#thesauri-name').type('New Thesauri with groups');
    cy.contains('button', 'Add group').click();
    cy.get('input#group-name').type('First group');
    cy.getByTestId('menu-form-submit').click();
    cy.contains('button', 'Add group').click();
    cy.get('input#group-name').clear();
    cy.get('input#group-name').type('Second group');
    cy.getByTestId('menu-form-submit').click();

    cy.contains('button', 'Save').click();
    cy.wait('@fetchThesauri');
  });

  it('tests Edit', () => {
    cy.contains('span', 'Thesauri').click();
    cy.wait('@fetchThesauri');
    cy.intercept('GET', '/api/dictionaries').as('fetchThesauriEditItems');
    cy.contains('button', 'Edit').click();
    cy.get('#thesauri-name').type(' edited');
    cy.contains('button', 'Edit').eq(0).click();
    cy.get('input#item-name').type(' edited');
    cy.getByTestId('menu-form-submit').click();
    cy.contains('button', 'Save').click();
    cy.wait('@fetchThesauriEditItems');
  });

  it('tests edit groups', () => {
    cy.contains('span', 'Thesauri').click();
    cy.wait('@fetchThesauri');
    cy.intercept('GET', '/api/dictionaries').as('fetchThesauriEditGroups');
    cy.contains('tr:nth-child(2) button', 'Edit').click();
    cy.get('#thesauri-name').type(' edited');
    cy.contains('button', 'Edit').eq(0).click();
    cy.get('input#group-name').type(' edited');
    cy.getByTestId('menu-form-submit').click();
    cy.contains('button', 'Save').click();
    cy.wait('@fetchThesauriEditGroups');
  });

  it('tests delete', () => {
    cy.contains('span', 'Thesauri').click();
    cy.wait('@fetchThesauri');
    cy.intercept('GET', '/api/dictionaries').as('fetchThesauriDelete');
    cy.get('input[type=checkbox]').eq(1).click();
    cy.contains('button', 'Delete').click();
    cy.contains('button', 'Accept').click();
    cy.wait('@fetchThesauriDelete');
  });
});
