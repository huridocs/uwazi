import { login } from './helpers';
import 'cypress-axe';

const changeLanguage = () => {
  cy.get('.menuNav-language > .dropdown').click();
  cy.get('li[aria-label="Languages"]  li.menuNav-item:nth-child(2) a').click();
};

const navigateToTranslationsPage = () => {
  cy.get('.only-desktop a[aria-label="Settings"]').click();
  cy.contains('span', 'Translations').click();
};

describe('Translations', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-puppeteer-fixtures', { env });

    cy.clearAllCookies();
    cy.visit('http://localhost:3000');
    changeLanguage();
    login('admin', 'admin');
  });

  it('Translations page should be accessible', () => {
    navigateToTranslationsPage();
    cy.get('[data-testid=settings-translations]').toMatchImageSnapshot({
      name: 'settings-translations',
    });
    cy.injectAxe();
    cy.checkA11y();
  });

  it('Translations form should be accessible', () => {
    cy.contains('[data-testid=content] button', 'Translate').click();
    cy.checkA11y();
  });

  it('Should edit a translation', () => {
    cy.get('form').should('be.visible');
    cy.get('[data-testid=settings-translations-edit]').toMatchImageSnapshot({
      name: 'edit-translations',
    });
    cy.get('input[type=text]').eq(1).siblings('button').click();
    cy.get('input[type=text]').eq(1).type('Data');
    cy.get('input[type=text]').eq(2).siblings('button').click();
    cy.get('input[type=text]').eq(2).type('Date');
    cy.contains('button', 'Save').click();
    cy.get('[data-testid=settings-translations-edit]').scrollTo('top');
    cy.get('[data-testid=table-element]').eq(0).toMatchImageSnapshot({ name: 'edited-context' });
  });

  it('Should filter out edited translations', () => {
    cy.contains('label', 'Untranslated Terms').click();
    cy.get('input[type=text]').eq(1).siblings('button').click();
    cy.get('input[type=text]').eq(1).type('Fecha in Arabic?');
    cy.get('[data-testid=table-element]').eq(0).toMatchImageSnapshot({ name: 'filtered-context' });
  });

  it('Should discard changes', () => {
    cy.contains('button', 'Cancel').click();
    cy.checkA11y();
    cy.contains('button', 'Discard changes').click();
    cy.get('[data-testid=settings-translations]').should('be.visible');
  });

  describe('Live translations', () => {
    //The translations modal has not been tested with checkA11y since is not yet rewritten
    it('Should navigate to library and active live translate', () => {
      cy.contains('a', 'Library').click();
      cy.contains('button', 'English').click();
      cy.contains('button', 'Live translate').click();
    });

    it('should translate a text', () => {
      cy.contains('span', 'Filters').click();
      cy.get('input[id=es]').clear();
      cy.get('input[id=es]').type('Filtros');
      cy.get('input[id=en]').clear();
      cy.get('input[id=en]').type('Filtering');
      cy.get('body').toMatchImageSnapshot({ name: 'live-translate-modal' });
      cy.contains('button', 'Submit').click();
      cy.get('[data-testid=modal]').should('not.be.visible');
    });

    it('should deactive the live translate and check the translatations in english and spanish', () => {
      cy.get('button[aria-label="Turn off inline translation"]').click();
      cy.contains('span', 'Filtering');
      cy.contains('button', 'English').click();
      cy.contains('a', 'Español').click();
      cy.contains('span', 'Filtros');
    });
  });
});
