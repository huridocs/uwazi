import { clearCookiesAndLogin } from '../helpers/login';
import 'cypress-axe';

const addLanguages = (languages: string[]) => {
  languages.forEach(lang => {
    cy.clearAndType('[data-testid=modal] input[type=text]', lang);
    cy.contains('button', lang).click();
  });
};

const stringToTranslate = "*please keep this key secret and don't share it.";

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
      cy.checkA11y();
    });

    it('should install new languages', () => {
      const BACKEND_LANGUAGE_INSTALL_DELAY = 25000;
      cy.intercept('POST', 'api/translations/languages').as('addLanguage');
      addLanguages(['Spanish', 'French']);
      cy.contains('[data-testid=modal] button', 'Install').click();
      cy.wait('@addLanguage');
      cy.contains('Dismiss').click();
      cy.contains('Spanish', { timeout: BACKEND_LANGUAGE_INSTALL_DELAY });
      cy.contains('French', { timeout: BACKEND_LANGUAGE_INSTALL_DELAY });
      cy.contains('Languages installed successfully').click();
    });

    it('should render the list of installed languages', () => {
      cy.get('[data-testid=settings-languages]').toMatchImageSnapshot();
      cy.contains('English');
      cy.contains('Spanish');
      cy.contains('French');
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
