import { clearCookiesAndLogin } from '../helpers/login';
import { contents, script } from '../helpers/entityViewPageFixtures';

describe('Pages', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin();
  });

  describe('Custom home page and styles', () => {
    const setLandingPage = (pageURL: string) => {
      cy.contains('a', 'Settings').click();
      cy.contains('a', 'Collection').click();
      cy.clearAndType('input[id="landing-page"]', pageURL);
      cy.contains('button', 'Save').click();
      cy.waitForNotification('Settings updated');
    };

    it('should allow setting up a custom CSS', () => {
      cy.contains('a', 'Settings').click();
      cy.contains('a', 'Global CSS').click();
      cy.get('textarea[name="settings.settings.customCSS"]').type(
        '.myDiv { color: white; font-size: 20px; background-color: red; }',
        { parseSpecialCharSequences: false }
      );
      cy.contains('button', 'Save').click();
      cy.waitForNotification('Settings updated');
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
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(501);
      cy.contains('button.bg-success-700', 'Save').click();
      cy.contains('Saved successfully');
      cy.get('input[id="page-url"]')
        .should('have.prop', 'value')
        .should('match', /\/page\/\w+\/custom-home-page$/g);
      cy.get('nav[aria-label="Breadcrumb"]').contains('Custom home page');
    });

    it('should allow setting the page as custom home page', () => {
      cy.get('input[id="page-url"]').then(url => {
        setLandingPage(url.val() as string);
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

    it('should allow settings a public entity as a landing page', () => {
      setLandingPage('/entity/7ycel666l65vobt9');
    });

    it('should check that the landing page is the defined entity', () => {
      cy.visit('http://localhost:3000');
      cy.reload();

      cy.get('.content-header-title > .item-name').should(
        'have.text',
        'Corte Interamericana de Derechos Humanos'
      );
    });

    it('should allow using a complex library query as a landing page', () => {
      setLandingPage(
        '/en/library/?q=(allAggregations:!f,filters:(),from:0,includeUnpublished:!t,limit:30,order:desc,sort:creationDate,treatAs:number,types:!(%2758ada34c299e82674854504b%27),unpublished:!f)'
      );
    });

    it('should check that the landing page is the defined library query', () => {
      cy.visit('http://localhost:3000');
      cy.reload();
      cy.contains('2 shown of 2 entities');
      cy.contains('Corte Interamericana de Derechos Humanos');
      cy.contains('Comisión Interamericana de Derechos Humanos');
    });

    it('should allow using a default library url with language as a landing page', () => {
      setLandingPage('/en/library/');
      cy.visit('http://localhost:3000');
      cy.reload();
      cy.contains('30 shown of');
      cy.contains('Artavia Murillo y otros.');
    });
  });

  describe('Pages list', () => {
    it('should render a list with all pages names', () => {
      cy.contains('a', 'Settings').click();
      cy.contains('a', 'Pages').click();
      cy.get('[data-testid="settings-content"] [data-testid="table"]').toMatchImageSnapshot();
    });

    it('should allow to edit and get a preview of the page', () => {
      cy.contains('table > tbody > tr:nth-child(1) > td:nth-child(5)', 'Edit').click();
      cy.contains('View page').invoke('attr', 'target', '_self').click();
      cy.location('pathname', { timeout: 500 }).should('include', 'page-with-error');
      cy.contains('This content may not work correctly.');
      cy.on('uncaught:exception', (_err, _runnable) => {
        cy.contains('There is an unexpected error on this custom page');
        return false;
      });
    });
  });

  describe('Page edition', () => {
    const deletePage = (selector: string) => {
      cy.get(selector).check();
      cy.contains('Delete').click();
      cy.contains('Accept').click();
    };

    it('should allow to cancel deletion', () => {
      cy.visit('localhost:3000/en/settings/pages');
      cy.get('table > tbody > tr:nth-child(1) > td > label > input').check();
      cy.contains('Delete').click();
      cy.contains('Are you sure?');
      cy.contains('Cancel').click();
      cy.contains('Deleted successfully').should('not.exist');
      cy.contains('Page with error');
    });

    it('should delete a page with confirmation', () => {
      deletePage('table > tbody > tr:nth-child(1) > td > label > input');
      cy.waitForNotification('Deleted successfully');
      cy.contains('Page with error').should('not.exist');
    });

    it('should not delete a page used as entity view', () => {
      deletePage('table > tbody > tr:nth-child(1) > td > label > input');
      cy.waitForNotification('An error occurred');
      cy.contains('Country page');
    });
  });

  describe('entity view', () => {
    it('should load a page for the assigned template', () => {
      cy.contains('Add page').click();
      cy.clearAndType('input[name="title"]', 'My entity view page');
      cy.contains('Code').click();
      cy.get('div[data-mode-id="html"]').type(contents, {
        parseSpecialCharSequences: false,
      });
      cy.contains('Advanced').click();
      cy.get('div[data-mode-id="javascript"]').type(script, {
        parseSpecialCharSequences: false,
      });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(501);
      cy.contains('button.bg-success-700', 'Save').click();
      cy.contains('Saved successfully');
    });

    it('should set the template as entity view', () => {
      cy.contains('a', 'Settings').click();
      cy.contains('a', 'Templates').click();
      cy.contains('a', 'Medida Provisional').click();
      cy.get('.slider').click();
      cy.get('select.form-control').select('My entity view page');
      cy.contains('Save').click();
      cy.contains('Saved successfully.');
    });
  });
});
