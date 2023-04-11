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
    cy.contains('caption', 'Fecha').should('be.visible');
    cy.get('table').eq(0).should('be.visible');
    cy.get('[data-testid=settings-translations]').toMatchImageSnapshot({
      name: 'edit-translations',
    });
    cy.get('input[type=text]').eq(0).clear();
    cy.get('input[type=text]').eq(0).type('Fecha edited');
    cy.contains('button', 'Save').click();
    cy.get('[data-testid=settings-translations]').scrollTo('top');
    cy.get('[data-testid=table-element]').eq(0).toMatchImageSnapshot({ name: 'edited-context' });
  });
});
