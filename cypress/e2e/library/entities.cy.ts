import { clearCookiesAndLogin } from '../helpers/login';

describe('Library', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-puppeteer-fixtures', { env });
    clearCookiesAndLogin();
  });

  describe('Entities', () => {
    it('should display entities in the library', () => {
      cy.visit('/library');
      cy.get('[data-testid="library-content"]').toMatchImageSnapshot();
    });

    it('should display entity details', () => {
      cy.intercept('GET', '/api/v2/search?*').as('search');
      cy.intercept('GET', '/api/references/search?*').as('references');
      cy.get('.item-document:first-child').click();
      cy.wait('@search');
      cy.wait('@references');
      cy.get('.metadata-sidepanel:visible').toMatchImageSnapshot();
    });
  });
});
