/* eslint-disable max-statements */
import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers/login';

describe('Thesauri configuration', () => {
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
    cy.intercept('GET', '/api/dictionaries?_id=*').as('editThesauri');
    cy.intercept('GET', '/api/dictionaries').as('fetchThesauri');
  });

  it('should add thesauri', () => {
    cy.contains('a', 'Add thesaurus').click();
    cy.get('#thesauri-name').type('New Thesauri', { delay: 0 });
    cy.contains('button', 'Add item').click();
    cy.get('input#item-name').type('First Item', { delay: 0 });
    cy.getByTestId('thesaurus-form-submit').click();

    cy.contains('button', 'Add item').click();
    cy.get('input#item-name').type('Second Item', { delay: 0 });
    cy.getByTestId('thesaurus-form-submit').click();

    cy.get('tbody tr').should('have.length', 2);
    cy.get('tbody tr:nth-of-type(1) td:nth-of-type(2)').should('have.text', 'First Item');
    cy.get('tbody tr:nth-of-type(2) td:nth-of-type(2)').should('have.text', 'Second Item');

    cy.contains('button', 'Save').click();
    cy.wait('@editThesauri');

    cy.contains('span', 'Thesauri').click();
    cy.wait('@fetchThesauri');
  });

  it('should add groups', () => {
    cy.intercept('GET', '/api/stats').as('fetchStats');
    cy.contains('a', 'Add thesaurus').click();
    cy.get('#thesauri-name').type('New Thesauri with groups', { delay: 0 });
    cy.contains('button', 'Add group').click();
    cy.get('input#group-name').type('First group', { delay: 0 });
    cy.getByTestId('thesaurus-form-submit').click();
    cy.contains('button', 'Add group').click();
    cy.get('input#group-name').clear();
    cy.get('input#group-name').type('Second group', { delay: 0 });
    cy.getByTestId('thesaurus-form-submit').click();
    cy.get('tbody tr').should('have.length', 2);
    cy.get('tbody tr:nth-of-type(1) td:nth-of-type(2)').should('have.text', 'First group');
    cy.get('tbody tr:nth-of-type(2) td:nth-of-type(2)').should('have.text', 'Second group');
    cy.contains('button', 'Save').click();
    cy.wait('@editThesauri');
    cy.wait('@fetchStats');
  });

  it('should edit value', () => {
    cy.intercept('GET', '/api/templates').as('fetchTemplates');
    cy.contains('span', 'Thesauri').click();
    cy.wait('@fetchThesauri');
    cy.wait('@fetchTemplates');
    cy.intercept('GET', '/api/stats').as('fetchStats');
    cy.contains('button', 'Edit').click();
    cy.wait('@fetchStats');
    cy.get('#thesauri-name').type(' edited', { delay: 0 });
    cy.contains('button', 'Edit').eq(0).click();
    cy.get('input#item-name').type(' edited', { delay: 0 });
    cy.getByTestId('thesaurus-form-submit').click();
    cy.contains('button', 'Save').click();
    cy.wait('@fetchThesauri');
    cy.get('tbody tr:nth-of-type(1) td:nth-of-type(2)').should('have.text', 'First Item edited');
    cy.wait('@editThesauri');
  });

  it('should edit groups', () => {
    cy.intercept('GET', '/api/templates').as('fetchTemplates');
    cy.contains('span', 'Thesauri').click();
    cy.wait('@fetchThesauri');
    cy.wait('@fetchTemplates');
    cy.contains('tr:nth-child(2) button', 'Edit').click();
    cy.get('#thesauri-name').type(' edited', { delay: 0 });
    cy.contains('button', 'Edit').eq(0).click();
    cy.get('input#group-name').type(' edited', { delay: 0 });
    cy.getByTestId('thesaurus-form-submit').click();
    cy.get('tbody tr:nth-of-type(2) td:nth-of-type(2)').should('have.text', 'First group edited');
    cy.contains('button', 'Save').click();
    cy.wait('@editThesauri');
  });

  it('should delete', () => {
    cy.intercept('GET', '/api/templates').as('fetchTemplates');
    cy.contains('span', 'Thesauri').click();
    cy.wait('@fetchThesauri');
    cy.wait('@fetchTemplates');
    cy.get('input[type=checkbox]').eq(1).click();
    cy.contains('button', 'Delete').click();
    cy.contains('button', 'Accept').click();
    cy.get('tbody tr').should('have.length', 1);
  });

  it('should not delete when in use', () => {
    cy.intercept('GET', 'api/templates').as('fetchtemplates');
    cy.contains('span', 'Templates').click();
    cy.contains('Edit').click();
    cy.get('aside .list-group-item:nth-of-type(3) button').click();
    cy.get('.metadataTemplate li:nth-of-type(3) .property-edit').click();
    cy.get('select').eq(1).select('New Thesauri with groups edited');
    cy.contains('Save').click();
    cy.wait('@fetchtemplates');
    cy.contains('span', 'Thesauri').click();
    cy.get('tbody tr:nth-of-type(1) input').should('be.disabled');
  });
});
