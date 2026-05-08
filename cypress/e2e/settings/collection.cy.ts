import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers/login.js';

const clickToggleButton = (label: string) => {
  cy.contains('span', label)
    .parent()
    .within(() => {
      cy.get('label').click();
    });
};

const checkToggleButton = (label: string, checked: boolean) => {
  cy.contains('span', label)
    .parent()
    .within(() => {
      cy.get('input').should(checked ? 'be.checked' : 'not.be.checked');
    });
};

// eslint-disable-next-line max-statements
describe('Collection', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin();
    cy.intercept('GET', '/api/templates').as('fetchTemplates');
    cy.intercept('GET', '/api/settings').as('fetchSettings');
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.get('nav[aria-label="Settings navigation"] a[href*="settings/collection"]').click();
    cy.wait('@fetchTemplates');
    cy.wait('@fetchSettings');
    cy.injectAxe();
  });

  it('should change collection Name', () => {
    cy.get('#collection-name').clear();
    cy.get('#collection-name').type('New Collection Name', { delay: 0 });
  });

  it('should change default library view', () => {
    cy.get('#roles').select('Table');
  });

  it('custom landing page', () => {
    cy.get('#landing-page').type(
      '/en/library/?q=(allAggregations:!f,filters:(),from:0,includeUnpublished:!t,limit:30,order:desc,sort:creationDate,treatAs:number,types:!(%2758ada34c299e82674854504b%27),unpublished:!f)',
      { delay: 0 }
    );
  });

  it('should save Analytics google and matomo successfully', () => {
    cy.contains('span', 'Forms and email configuration').scrollIntoView();
    cy.get('#google-analytics').type('google-analytics-key', { delay: 0 });
    cy.get('#matomo-analytics').type('matomo-analytics-key', { delay: 0 });
  });

  it('should save Forms and email configurations successfully', () => {
    cy.get('#sending-email').type('email@mailer.com', { delay: 0 });
    cy.get('#receiving-email').type('reciever@mailer.com', { delay: 0 });
    cy.get('#public-form-destination').type('/public/form/url', { delay: 0 });
    clickToggleButton('Non-latin characters support');
  });

  it('should save Whitelisted templates successfully', () => {
    cy.get('[data-testid="settings-collection"]').parent().scrollTo('center');
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
    clickToggleButton('Public instance');
    clickToggleButton('Show cookie policy');
    clickToggleButton('Global JS');
    clickToggleButton('Non-latin characters support');
    clickToggleButton('Allow captcha bypass');
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
    cy.get('[data-testid="pill-comp"] > span').eq(0).should('have.text', 'Mecanismo');
    cy.get('[data-testid="pill-comp"] > span').eq(1).should('have.text', 'Causa');
  });

  it('should have changed all the buttons', () => {
    checkToggleButton('Public instance', false);
    checkToggleButton('Show cookie policy', true);
    checkToggleButton('Global JS', true);
    checkToggleButton('Allow captcha bypass', true);
  });

  it('should successfully have selected Map view and loaded maplayers', () => {
    cy.intercept('GET', '/api/templates').as('fetchTemplates');
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.get('nav[aria-label="Settings navigation"] a[href*="settings/collection"]').click();
    cy.wait('@fetchTemplates');
    cy.get('[data-testid="map-container"]').scrollIntoView();
    cy.get('.leaflet-control-layers-list .leaflet-control-layers-base label')
      .its('length')
      .should('eq', 2);
  });

  it('should load the selected search as landing page ', () => {
    cy.contains('a', 'Library').click();
    cy.reload();
    cy.on('uncaught:exception', (err, _runnable) => {
      err.message.includes('Hydration failed');
      return false;
    });
    cy.contains('a', 'New Collection Name').scrollIntoView();
    cy.contains('a', 'New Collection Name').click({ force: true });
    cy.get('.item').should('have.length', 2);
  });
});
