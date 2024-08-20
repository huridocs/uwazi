/* eslint-disable max-statements */
import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers/login';

describe('Thesauri configuration', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    //cy.exec('yarn e2e-fixtures', { env });
    //clearCookiesAndLogin();
    cy.visit('http://localhost:3000');
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    // cy.injectAxe();
    // cy.checkAccessibility1();
    cy.contains('span', 'Thesauri').click();
  });

  // it('should have no detectable accessibility violations on load', () => {
  // cy.checkA11y();
  // });

  beforeEach(() => {
    cy.intercept('GET', '/api/dictionaries?_id=*').as('editThesauri');
    cy.intercept('GET', '/api/dictionaries').as('fetchThesauri');
  });

  it('should create a thesaurus', () => {
    cy.contains('a', 'Add thesaurus').click();
    cy.get('#thesauri-name').type('New Thesauri1', { delay: 0 });
    cy.contains('button', 'Add item').click();
    cy.get('input[name="newValues.0.label"]').type('First Item', { delay: 0 });
    cy.get('input[name="newValues.1.label"]').type('Second Item', { delay: 0 });
    cy.getByTestId('thesaurus-form-submit').click();
    cy.get('tbody tr').should('have.length', 2);
    cy.contains('button', 'Save').click();
    cy.contains('Thesauri added.');
    cy.contains('Dismiss').click();
  });

  it('should add groups', () => {
    cy.contains('button', 'Add group').click();
    cy.get('input#group-name').type('Group A', { delay: 0 });
    cy.get('input[name="subRows.0.label"]').type('First Child A', { delay: 0 });
    cy.get('input[name="subRows.1.label"]').type('Second Child A', { delay: 0 });
    cy.getByTestId('thesaurus-form-submit').click();
    cy.get('tbody tr').should('have.length', 3);
    cy.contains('button', 'Add group').click();
    cy.get('input#group-name').type('Group B', { delay: 0 });
    cy.get('input[name="subRows.0.label"]').type('First Child B', { delay: 0 });
    cy.getByTestId('thesaurus-form-submit').click();
    cy.get('tbody tr').should('have.length', 4);
    cy.contains('button', 'Save').click();
    cy.contains('Thesauri updated.');
    cy.contains('Dismiss').click();
  });

  it('should add items', () => {
    cy.contains('button', 'Add item').click();
    cy.get('input[name="newValues.0.label"]').type('Added Root Item', { delay: 0 });
    cy.get('input[name="newValues.1.label"]').type('Added Child Item', { delay: 0 });
    cy.get('select[name="newValues.1.groupId"]').select('Group A');
    cy.getByTestId('thesaurus-form-submit').click();
    cy.get('tbody tr').should('have.length', 5);
    cy.contains('button', 'Save').click();
    cy.contains('Thesauri updated.');
    cy.contains('Dismiss').click();
  });

  it('should edit an item', () => {
    cy.contains('Second Item').parentsUntil('tr').parent().contains('button', 'Edit').click();
    cy.clearAndType('input[name="newValues.0.label"]', 'Edited Second Item', { delay: 0 });
    cy.getByTestId('thesaurus-form-submit').click();
    cy.get('tbody tr').should('have.length', 5);
    cy.contains('button', 'Save').click();
    cy.contains('Thesauri updated.');
    cy.contains('Dismiss').click();
  });

  it('should edit a group', () => {
    cy.contains('Group B').parentsUntil('tr').parent().contains('button', 'Edit').click();
    cy.clearAndType('input#group-name', 'Edited Group B', { delay: 0 });
    cy.clearAndType('input[name="subRows.0.label"]', 'Edited First Child B', { delay: 0 });
    cy.get('input[name="subRows.1.label"]').type('Added Second Child B', { delay: 0 });
    cy.get('input[name="subRows.2.label"]').type('Added Third Child B', { delay: 0 });
    cy.getByTestId('thesaurus-form-submit').click();
    cy.get('tbody tr').should('have.length', 5);
    cy.contains('button', 'Save').click();
    cy.contains('Thesauri updated.');
    cy.contains('Dismiss').click();
  });

  it('should delete items', () => {
    cy.contains('Edited Second Item')
      .parentsUntil('tr')
      .parent()
      .eq(0)
      .within(() => cy.get('input[type="checkbox"]').check());
    cy.contains('Edited Group B').parentsUntil('tr').parent().contains('button', 'Group').click();
    cy.contains('Added Second Child B')
      .parentsUntil('tr')
      .parent()
      .eq(0)
      .within(() => cy.get('input[type="checkbox"]').check());
    cy.contains('button', 'Remove').click();
    cy.contains('button', 'Save').click();
    cy.contains('Thesauri updated.');
    cy.contains('Dismiss').click();
    cy.get('tbody tr').should('have.length', 6);
  });
});
