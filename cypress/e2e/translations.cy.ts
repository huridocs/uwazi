import { login } from './helpers';

const changeLanguage = () => {
  cy.get('.menuNav-language > .dropdown').click();
  cy.get('div[aria-label="Languages"]  li.menuNav-item:nth-child(2) a').click();
};

const englishLoggedInUwazi = () => {
  cy.visit('http://localhost:3000');
  changeLanguage();
  login('admin', 'admin');
};

const navigateToTranslationsPage = () => {
  cy.get('.only-desktop a[aria-label="Settings"]').click();
  cy.contains('span', 'Translations').click();
};

describe('Translations', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-puppeteer-fixtures', { env });

    cy.visit('http://localhost:3000');
    changeLanguage();
    login('admin', 'admin');
  });

  it('Should visit the translations page', () => {
    navigateToTranslationsPage();
    cy.get('[data-testid=settings-translations]').toMatchImageSnapshot({
      name: 'settings-translations',
    });
  });

  it('Should edit a translation', () => {
    englishLoggedInUwazi();
    navigateToTranslationsPage();
    cy.contains('[data-testid=content] button', 'Translate').click();
    cy.get('form').should('be.visible');
    cy.get('[data-testid=settings-translations]').toMatchImageSnapshot({
      name: 'edit-translations',
    });
    cy.get('input[type=text]').eq(0).clear().type('Fecha edited');
    cy.contains('button', 'Save').click();
    cy.get('[data-testid=settings-translations]').scrollTo('top');
    cy.get('[data-testid=table-element]').eq(0).toMatchImageSnapshot({ name: 'edited-context' });
  });
});
