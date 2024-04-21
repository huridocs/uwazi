/* eslint-disable max-statements */
import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers/login';

describe('Relationship Types configuration', () => {
  before(() => {
    clearCookiesAndLogin('admin', 'change this password now');
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.injectAxe();
    cy.contains('span', 'Relationship types').click();
  });

  it('should have no detectable accessibility violations on load', () => {
    cy.checkA11y();
  });

  beforeEach(() => {
    cy.intercept('GET', 'api/relationtypes').as('fetchTypes');
    cy.intercept('GET', 'api/templates').as('fetchtemplates');
  });

  it('tests add types', () => {
    cy.getByTestId('relationship-types-add').click();
    cy.checkA11y();
    cy.get('#relationship-type-name').click();
    cy.get('#relationship-type-name').type('Parent');

    cy.getByTestId('relationship-type-form-submit').click();
    cy.wait('@fetchTypes');
    cy.contains('Dismiss').click();

    cy.getByTestId('relationship-types-add').click();
    cy.get('#relationship-type-name').click();
    cy.get('#relationship-type-name').type('Son');

    cy.getByTestId('relationship-type-form-submit').click();
    cy.wait('@fetchTypes');
    cy.contains('Dismiss').click();
  });

  it('tests Edit', () => {
    cy.get('tbody tr:nth-of-type(1)').contains('Edit').click();
    cy.get('#relationship-type-name').click();
    cy.get('#relationship-type-name').type('Edited');
    cy.getByTestId('relationship-type-form-submit').click();

    cy.wait('@fetchTypes');
    cy.contains('Dismiss').click();
  });

  it('tests delete', () => {
    cy.get('tbody tr:nth-of-type(1) input').click();

    cy.getByTestId('relationship-types-delete').click();
    cy.checkA11y();
    cy.getByTestId('cancel-button').click();

    cy.getByTestId('relationship-types-delete').click();
    cy.getByTestId('accept-button').click();
    cy.wait('@fetchTypes');
    cy.contains('Dismiss').click();
  });

  it('test cant delete when in use', () => {
    cy.contains('span', 'Templates').click();
    cy.contains('Edit').click();
    cy.get('aside .list-group-item:nth-of-type(4) button').click();
    cy.get('.metadataTemplate li:nth-of-type(3) .property-edit').click();
    cy.get('select').eq(0).select('Son');

    cy.contains('Save').click();
    cy.wait('@fetchtemplates');
    cy.contains('span', 'Relationship types').click();

    cy.get('tbody tr:nth-of-type(1) input').should('be.disabled');
  });
});
