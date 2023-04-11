import { login } from './helpers';
import 'cypress-axe';

const changeLanguage = () => {
  cy.get('.menuNav-language > .dropdown').click();
  cy.get('div[aria-label="Languages"]  li.menuNav-item:nth-child(2) a').click();
};

describe('Translations', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-puppeteer-fixtures', { env });
  });

  beforeEach(() => {
    cy.visit('http://localhost:3000');
    changeLanguage();
    login('admin', 'admin');

    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.contains('span', 'Translations').click();
    cy.injectAxe();
  });

  it('Translations should render a list of contexts to translate', () => {
    cy.get('[data-testid=settings-translations]').toMatchImageSnapshot({
      name: 'settings-translations',
    });

    cy.checkA11y();
  });

  it('Should edit a translation', () => {
    cy.contains('[data-testid=content] button', 'Translate').click();
    cy.checkA11y();
    cy.get('form').should('be.visible');
    cy.contains('caption', 'Fecha').should('be.visible');
    cy.get('table').eq(0).should('be.visible');
    cy.get('[data-testid=settings-translations]').toMatchImageSnapshot({
      name: 'edit-translations',
    });

    cy.get('input[type=text]').eq(0).clear().type('Fecha edited');
    cy.contains('button', 'Save').click();
    cy.get('[data-testid=settings-translations]').scrollTo('top');
    cy.get('[data-testid=table-element]').eq(0).get('input').should('have.length', 9);
    cy.get('[data-testid=table-element]').eq(0).toMatchImageSnapshot({ name: 'edited-context' });
  });
});
