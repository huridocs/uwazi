import { clearCookiesAndLogin } from '../helpers/login';

describe('Pages', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin();
  });

  describe('Custom home page and styles', () => {
    it('should allow setting up a custom CSS', () => {
      cy.contains('a', 'Settings').click();
      cy.contains('a', 'Global CSS').click();
      cy.get('textarea[name="settings.settings.customCSS"]').type(
        '.myDiv { color: white; font-size: 20px; background-color: red; }',
        { parseSpecialCharSequences: false }
      );
      cy.contains('button', 'Save').click();
    });

    it('should create a page to be used as home', () => {
      cy.contains('a', 'Pages').click();
      cy.contains('Add page').click();
      cy.clearAndType('input[name="title"]', 'Custom home page');
      cy.contains('Code').click();
      cy.get('div[data-mode-id="html"]').type(
        '<h1>Custom HomePage header</h1><div class="myDiv">contents</div>',
        { parseSpecialCharSequences: false }
      );
      cy.get('.monaco-editor', { timeout: 500 }).eq(0).click(0, 0);
      cy.contains('button', 'Save').click();
      cy.contains('Saved successfully');
      cy.get('input[id="page-url"]')
        .should('have.prop', 'value')
        .should('match', /\/page\/\w+\/custom-home-page$/g);
      cy.get('nav[aria-label="Breadcrumb"]').contains('Custom home page');
    });

    it('should allow setting the page as custom home page', () => {
      let pagePath: string;
      cy.get('input[id="page-url"]').then(path => {
        pagePath = path.val() as string;
        cy.contains('a', 'Collection').click();
        cy.get('input[id="landing-page"]').type(pagePath);
        cy.contains('button', 'Save').click();
      });
    });

    it('should render the custom page as home page with the custom CSS styles', () => {
      cy.visit('http://localhost:3000');
      cy.reload();
      cy.get('h1').contains('Custom HomePage header');
      cy.get('div.myDiv').should('have.css', 'color', 'rgb(255, 255, 255)');
      cy.get('div.myDiv').should('have.css', 'backgroundColor', 'rgb(255, 0, 0)');
      cy.get('div.myDiv').should('have.css', 'fontSize', '20px');
    });
  });
});
