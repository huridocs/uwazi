/* eslint-disable max-statements */
import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers/login';

describe('Collection', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-puppeteer-fixtures', { env });
    clearCookiesAndLogin();
    cy.intercept('GET', '/api/templates').as('fetchTemplates');
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.contains('span', 'Collection').click();
    cy.wait('@fetchTemplates');
    cy.injectAxe();
  });

  it('should have no detectable accessibility violations on load', () => {
    cy.checkA11y();
  });

  it('should change collection Name', () => {
    cy.get('#collection-name').clear();
    cy.get('#collection-name').type('New Collection Name');
  });

  it('should change default library view', () => {
    cy.get('#roles').select('Table');
  });

  it('custom landing page', () => {
    cy.get('#landing-page').type(
      '/en/library/?q=(allAggregations:!f,filters:(),from:0,includeUnpublished:!t,limit:30,order:desc,sort:creationDate,treatAs:number,types:!(%2758ada34c299e82674854504b%27),unpublished:!f)'
    );
  });

  it('should save Analytics google and matomo successfully', () => {
    cy.contains('span', 'Forms and email configuration').scrollIntoView();
    cy.get('#google-analytics').type('google-analytics-key');
    cy.get('#matomo-analytics').type('matomo-analytics-key');
  });

  it('should save Forms and email configurations successfully', () => {
    cy.get('#sending-email').type('email@mailer.com');
    cy.get('#receiving-email').type('reciever@mailer.com');
    cy.get('#public-form-destination').type('/public/form/url');
    cy.get('[data-testid="enable-button-checkbox"]').eq(3).click();
  });

  it('should save Whitelisted templates successfully', () => {
    cy.get('[data-testid="settings-collection"]').scrollTo('center');
    cy.get('[data-testid="multiselect"]')
      .eq(0)
      .within(() => {
        cy.get('button').eq(0).click();
        cy.contains('[data-testid="multiselect-popover"] label', 'Mecanismo').click();
        cy.contains('[data-testid="multiselect-popover"] label', 'Causa').click();
      });
  });

  it('should set map Layers', () => {
    cy.get('[data-testid="multiselect"]')
      .eq(1)
      .within(() => {
        cy.get('button').eq(0).click();
      });
    cy.get('[data-testid="multiselect-popover"] li').its('length').should('eq', 4);
    cy.get('[data-testid="multiselect-popover"] li').eq(3).click();
    cy.get('#roles').select('Map');
  });

  it('should enable public instance, show cookies policy and Global JS', () => {
    cy.get('[data-testid="enable-button-checkbox"]').eq(0).click();
    cy.get('[data-testid="enable-button-checkbox"]').eq(1).click();
    cy.get('[data-testid="enable-button-checkbox"]').eq(2).click();
    cy.get('[data-testid="enable-button-checkbox"]').eq(3).click();
    cy.get('[data-testid="enable-button-checkbox"]').eq(4).click();
  });

  it('should save', () => {
    cy.contains('button', 'Save').click();
  });

  it('should have saved values in all collection inputs', () => {
    cy.get('#collection-name').should('have.value', 'New Collection Name');
    cy.get('#google-analytics').should('have.value', 'google-analytics-key');
    cy.get('#matomo-analytics').should('have.value', 'matomo-analytics-key');
    cy.get('#sending-email').should('have.value', 'email@mailer.com');
    cy.get('#receiving-email').should('have.value', 'reciever@mailer.com');
    cy.get('#public-form-destination').should('have.value', '/public/form/url');
    cy.get('[name="openPublicEndpoint"]').should('be.checked');
  });

  it('should whitelist templates successfully', () => {
    cy.get('[data-testid="pill-comp"] > span').eq(0).should('have.text', 'Causa');
    cy.get('[data-testid="pill-comp"] > span').eq(1).should('have.text', 'Mecanismo');
  });

  it('should have changed all the buttons', () => {
    cy.get('[data-testid="enable-button-checkbox"]')
      .eq(0)
      .within(() => {
        cy.get('input').should('not.be.checked');
      });
    cy.get('[data-testid="enable-button-checkbox"]')
      .eq(1)
      .within(() => {
        cy.get('input').should('be.checked');
      });
    cy.get('[data-testid="enable-button-checkbox"]')
      .eq(2)
      .within(() => {
        cy.get('input').should('be.checked');
      });
  });

  it('should successfully have selected Map view and loaded maplayers', () => {
    cy.intercept('GET', '/api/templates').as('fetchTemplates');
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.contains('span', 'Collection').click();
    cy.wait('@fetchTemplates');
    cy.get('[data-testid="map-container"]').scrollIntoView();
    cy.get('.leaflet-control-layers-list .leaflet-control-layers-base label')
      .its('length')
      .should('eq', 2);
  });
});
