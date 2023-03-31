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
    cy.exec('yarn ix-config', { env });

    cy.visit('http://localhost:3000');
    changeLanguage();
    login('admin', 'admin');
  });

  it('Should visit the translations page', () => {
    navigateToTranslationsPage();
    cy.get('[data-cy=settings-translations]').toMatchImageSnapshot({
      name: 'settings-translations',
    });
  });

  it('Should edit a translation', () => {
    englishLoggedInUwazi();
    navigateToTranslationsPage();
    cy.get('[data-cy=content]').as('contentTranslations');
    cy.get('@contentTranslations').contains('button', 'Translate').click();
    cy.get('[data-cy=settings-translations]').toMatchImageSnapshot({ name: 'edit-translations' });
    cy.get('[data-testid=table-element]').eq(0).as('fechaTable');
    cy.get('@fechaTable').get('input[type=text]').eq(0).clear().type('Fecha edited');
    cy.contains('button', 'Save').click();
    cy.get('[data-cy=settings-translations]').scrollTo('top');
    cy.get('[data-testid=table-element]').eq(0).toMatchImageSnapshot();
  });
});
