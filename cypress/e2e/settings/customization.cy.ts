import 'cypress-axe';
// @ts-ignore
import { SinonSpy } from 'cypress/types/sinon';
import { clearCookiesAndLogin } from '../helpers/login.js';
import { logA11yViolations } from '../../support/helpers/a11y.js';

let spy: Cypress.Agent<SinonSpy<any[], any>>;
Cypress.on('window:before:load', win => {
  spy = cy.spy(win.console, 'log');
});

describe('customization', () => {
  before(() => {
    cy.blankState();
    clearCookiesAndLogin('admin', 'change this password now');
    cy.contains('a', 'Settings').click();
    cy.injectAxe();
  });

  it('should add custom CSS', () => {
    cy.contains('a', 'Global CSS').click();
    cy.checkA11y(undefined, undefined, logA11yViolations);
    cy.get('.monaco-editor textarea')
      .first()
      .realClick()
      .realType('header {{}background-color: red;}');
    cy.contains('button', 'Save').should('not.be.disabled');
  });

  it('should block navigation', () => {
    cy.contains('a', 'Account').click();
    cy.contains('Discard changes?');
    cy.contains('button', 'Cancel').click();
  });

  it('should save the custom CSS', () => {
    cy.contains('button', 'Save').click();
    cy.contains('Saved successfully.');
    cy.contains('button', 'Save').should('be.disabled');
  });

  it('should enabled global javascript', () => {
    cy.contains('a', 'Collection').click();
    cy.get('#collection-form').within(() => {
      cy.contains('Global JS')
        .parent()
        .within(() => {
          cy.contains('label', 'Activate').click();
        });
    });
    cy.contains('button', 'Save').click();
    cy.contains('Settings updated.');
  });

  it('should add custom javascript', () => {
    cy.contains('a', 'Global CSS & JS').click();
    cy.checkA11y({ exclude: [['.leaflet-marker-icon']] }, undefined, logA11yViolations);
    cy.contains('Custom JS').click();
    cy.get('#panel-js .monaco-editor textarea')
      .realClick()
      .realType('console.log("My custom js log")');
    cy.contains('button', 'Save').should('not.be.disabled');
    cy.contains('button', 'Save').click();
    cy.contains('Saved successfully.');
  });

  it('should check the customizations', () => {
    cy.reload();
    cy.get('header').should('have.css', 'backgroundColor', 'rgb(255, 0, 0)');
    cy.wrap({}).should(() => expect(spy).to.be.calledWith('My custom js log'));
  });
});
