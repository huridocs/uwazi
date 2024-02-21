import 'cypress-axe';
import { SinonSpy } from 'cypress/types/sinon';
import { clearCookiesAndLogin } from '../helpers/login';

let spy: Cypress.Agent<SinonSpy<any[], any>>;
Cypress.on('window:before:load', win => {
  spy = cy.spy(win.console, 'log');
});

describe('customization', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn blank-state --force', { env });
    clearCookiesAndLogin('admin', 'change this password now');
    cy.injectAxe();
    cy.contains('a', 'Settings').click();
  });

  it('should add custom CSS', () => {
    cy.contains('a', 'Global CSS').click();
    cy.checkA11y();
    cy.get('div[data-mode-id="css"]').type('header {background-color: red;}', {
      parseSpecialCharSequences: false,
      delay: 0,
    });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(501);
  });

  it('should block navigation', () => {
    cy.contains('a', 'Account').click();
    cy.contains('Discard changes?');
    cy.contains('button', 'Cancel').click();
  });

  it('should save the custom CSS', () => {
    cy.contains('button', 'Save').click();
    cy.contains('Saved successfully.');
    cy.contains('button', 'Dismiss').click();
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
    cy.contains('button', 'Dismiss').click();
  });

  it('should add custom javascript', () => {
    cy.contains('a', 'Global CSS & JS').click();
    cy.checkA11y();
    cy.contains('Custom JS').click();
    cy.get('div[data-mode-id="javascript"]').type('console.log("My custom js log")', {
      parseSpecialCharSequences: false,
      delay: 0,
    });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(501);
    cy.contains('button', 'Save').click();
    cy.contains('Saved successfully.');
  });

  it('should check the customizations', () => {
    cy.reload();
    cy.get('header').should('have.css', 'backgroundColor', 'rgb(255, 0, 0)');
    cy.wrap({}).should(() => expect(spy).to.be.calledWith('My custom js log'));
  });
});
