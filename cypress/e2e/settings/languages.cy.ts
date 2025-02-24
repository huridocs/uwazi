import { clearCookiesAndLogin } from '../helpers/login';
import 'cypress-axe';

const stringToTranslate = "*please keep this key secret and don't share it.";

const addLanguages = () => {
  cy.contains('Install Language').click();
  cy.get('[data-testid=modal]')
    .should('be.visible')
    .within(() => {
      cy.get('input[type=text]').realClick().realType('Spanish');
      cy.contains('button', 'Spanish').should('be.visible').realClick();
      cy.get('input[type=text]').clear();
      cy.get('input[type=text]').realType('French');
      cy.contains('button', 'French').should('be.visible').realClick();
      cy.get('input[type=text]').clear();
      cy.contains('label', '(2)').click();
      cy.contains('span', '* French (fr)').should('be.visible');
      cy.contains('span', '* Spanish (es)').should('be.visible');
    });
  cy.get('[data-testid=modal]').within(() => {
    cy.contains('button', 'Install (2)').realClick();
  });
  cy.get('[data-testid=modal]').should('not.exist');
};

describe('Languages', () => {
  before(() => {
    cy.blankState();
    clearCookiesAndLogin('admin', 'change this password now');
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.injectAxe();
    cy.contains('span', 'Languages').click();
  });

  describe('Languages List', () => {
    it('should open the install language modal', () => {
      cy.contains('Install Language').click();
      cy.get('[data-testid=modal]').should('be.visible');
      cy.checkA11y();
      cy.get('[data-testid=modal]').within(() => {
        cy.contains('button', 'Cancel').click();
      });
    });

    it('should install new languages', () => {
      const BACKEND_LANGUAGE_INSTALL_DELAY = 25000;
      cy.intercept('POST', 'api/translations/languages').as('addLanguage');

      addLanguages();

      cy.wait('@addLanguage');
      cy.contains('Dismiss').click();
      cy.contains('tr', 'Spanish', { timeout: BACKEND_LANGUAGE_INSTALL_DELAY });
      cy.contains('tr', 'French', { timeout: BACKEND_LANGUAGE_INSTALL_DELAY });
      cy.contains('Languages installed successfully').click();
    });

    it('should render the list of installed languages', () => {
      cy.get('[data-testid=settings-languages]').toMatchImageSnapshot();
      cy.contains('tr', 'English');
      cy.contains('tr', 'Spanish');
      cy.contains('tr', 'French');
      cy.checkA11y();
    });
  });

  describe('Cancel an action', () => {
    it('should allow to cancel an action', () => {
      cy.intercept('DELETE', 'api/translations/languages*').as('deleteLanguage');
      cy.contains('tr', 'Spanish').contains('Uninstall').click();
      cy.get('[data-testid=modal] input').type('CONFIRM', { delay: 0 });
      cy.contains('[data-testid=modal] button', 'No, cancel').click();
      cy.contains('Spanish').should('exist');
    });
  });

  describe('Uninstall Language', () => {
    it('should uninstall the language and remove it from the list', () => {
      cy.intercept('DELETE', 'api/translations/languages*').as('deleteLanguage');
      cy.contains('tr', 'French').contains('Uninstall').click();
      cy.get('[data-testid=modal] input').type('CONFIRM', { delay: 0 });
      cy.contains('[data-testid=modal] button', 'Uninstall').click();

      cy.wait('@deleteLanguage');
      cy.contains('Dismiss').click();
      cy.contains('Language uninstalled successfully').click();
      cy.contains('French').should('not.exist');
    });
  });

  describe('Set as default', () => {
    it('should set the language as default', () => {
      cy.intercept('POST', 'api/translations/setasdeafult').as('setDefault');
      cy.contains('tr', 'Spanish').contains('button', 'Default').click();
      cy.wait('@setDefault');
      cy.contains('tr', 'Spanish').contains('Uninstall').should('not.exist');
      cy.contains('Dismiss').click();
    });
    it('should use the default language if there is not specified locale', () => {
      cy.clearAllCookies();
      cy.visit('http://localhost:3000/login');
      cy.contains('Usuario');
      cy.get('input[name="username"').type('admin');
      cy.get('input[name="password"').type('change this password now');
      cy.intercept('POST', '/api/login').as('login');
      cy.contains('button', 'Acceder').click();
      cy.wait('@login');
      cy.contains('ordenado por');
    });
    it('should change to other language different than default', () => {
      cy.contains('button', 'Español').click();
      cy.contains('a', 'English').click();
      cy.on('uncaught:exception', (err, _runnable) => {
        err.message.includes('Hydration failed');
        return false;
      });
      cy.get('.only-desktop a[aria-label="Settings"]').click();
    });
  });

  describe('Reset Language', () => {
    it('should change a spanish translation', () => {
      cy.intercept('POST', 'api/translations').as('saveTranslation');
      cy.contains('span', 'Translations').click();
      cy.contains('tr', 'User Interface').contains('button', 'Translate').click();
      cy.contains('table', stringToTranslate).contains('tr', 'Español').find('input').clear();
      cy.contains('table', stringToTranslate)
        .contains('tr', 'Español')
        .find('input')
        .type('test', { delay: 0 });
      cy.contains('button', 'Save').click();
      cy.contains('Translations saved');
    });

    it('should reset the spanish language', () => {
      cy.intercept('POST', 'api/translations/populate').as('resetLanguage');
      cy.contains('a span', 'Languages').click();
      cy.contains('tr', 'Spanish').contains('button', 'Reset').click();
      cy.get('[data-testid=modal] input').type('CONFIRM', { delay: 0 });
      cy.contains('[data-testid=modal] button', 'Reset').click();
      cy.wait('@resetLanguage');
    });

    it('should reset the spanish translation', () => {
      cy.contains('span', 'Translations').click();
      cy.contains('tr', 'User Interface').contains('button', 'Translate').click();
      cy.contains('table', stringToTranslate)
        .contains('tr', 'Español')
        .find('input')
        .should('have.value', stringToTranslate);
    });
  });
});
