/* eslint-disable max-statements */
import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers/login';

describe('Collection', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    // cy.exec('yarn blank-state', { env });
    cy.exec('yarn e2e-puppeteer-fixtures', { env });
    clearCookiesAndLogin();
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.injectAxe();
    cy.contains('span', 'Collection').click();
    cy.get('[data-testid="enable-button-checkbox"]').eq(3).click();
    cy.contains('button', 'Save').click();
    ///
  });

  // it('should have no detectable accessibility violations on load', () => {
  //   cy.checkA11y();
  // });

  // beforeEach(() => {
  //   cy.intercept('GET', 'api/settings/links').as('fetchLinks');
  // });

  it('Change collection Name', () => {
    const newName = 'New Collection Name';
    cy.intercept('GET', '/api/templates').as('fetchTemplates');
    cy.get('#collection-name').clear();
    cy.get('#collection-name').type(newName);
    cy.contains('button', 'Save').click();

    cy.wait('@fetchTemplates');
    cy.contains('header a', newName).should('exist');
  });

  it('Change default library view', () => {
    cy.intercept('GET', '/api/templates').as('fetchTemplates');
    cy.get('#roles').select('Table');
    cy.contains('button', 'Save').click();
    cy.wait('@fetchTemplates');
    cy.get('a[aria-label="Library"]').click();
    cy.get('table').should('exist');
  });

  it('custom landing page', () => {
    cy.intercept('GET', '/api/stats').as('fetchStats');
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.wait('@fetchStats');
    cy.contains('span', 'Collection').click();
    cy.get('#landing-page').type(
      '/en/library/?q=(allAggregations:!f,filters:(),from:0,includeUnpublished:!t,limit:30,order:desc,sort:creationDate,treatAs:number,types:!(%2758ada34c299e82674854504b%27),unpublished:!f)'
    );
    cy.visit('http://localhost:3000');
  });

  it('Set map Layers', () => {
    cy.intercept('GET', '/api/stats').as('fetchStats');
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.wait('@fetchStats');
    cy.contains('span', 'Collection').click();
    cy.get('[data-testid="multiselect"]')
      .eq(1)
      .within(() => {
        cy.get('button').eq(0).click();
      });
    cy.get('[data-testid="multiselect-popover"] li').its('length').should('eq', 4);
    cy.get('[data-testid="multiselect-popover"] li').eq(3).click();
    cy.intercept('GET', '/api/templates').as('fetchTemplates');
    cy.get('#roles').select('Map');
    cy.contains('button', 'Save').click();
    cy.wait('@fetchTemplates');

    // Assert
    cy.get('[aria-label="Library"]').click();
    cy.get('.leaflet-control-layers-list .leaflet-control-layers-base label')
      .its('length')
      .should('eq', 2);
  });

  it('Change default date format', () => {
    const frozen = new Date(2024, 0, 20).getTime();
    cy.clock(frozen);
    cy.intercept('GET', '/api/stats').as('fetchStats');
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.wait('@fetchStats');
    cy.contains('span', 'Collection').click();
    cy.get('#date-format').select('01/20/2024 (Month/Day/Year)');
    // cy.intercept('GET', '/api/templates').as('fetchTemplates');
    cy.contains('button', 'Save').click();
    // cy.wait('@fetchTemplates');
    cy.contains('[data-testid="notifications-container"] button', 'Dismiss').click();
    cy.get('a[aria-label="Library"]').click();
    cy.intercept('GET', '/api/thesauris').as('fetchThesauris');
    cy.contains('button', 'Create entity').click();
    cy.get('#tabpanel-metadata select.form-control').select('Causa');
    cy.wait('@fetchThesauris');
    cy.get('.react-datepicker__input-container input')
      .invoke('attr', 'placeholder')
      .should('eq', 'MM/dd/yyyy');
  });
});
