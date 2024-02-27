import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers/login';
import { contents, script } from '../helpers/entityViewPageFixtures';

describe('Pages', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin();
    cy.injectAxe();
    cy.contains('a', 'Settings').click();
  });

  describe('accessibility', () => {
    it('should check for accissibility violations', () => {
      cy.contains('a', 'Pages').click();
      cy.checkA11y();
      cy.contains('a', 'Add page').click();
      cy.checkA11y();
    });
  });

  describe('Custom home page', () => {
    const setLandingPage = (pageURL: string) => {
      cy.contains('a', 'Settings').click();
      cy.contains('a', 'Collection').click();
      cy.clearAndType('input[id="landing-page"]', pageURL);
      cy.contains('button', 'Save').click();
      cy.contains('Settings updated');
    };

    it('should create a page to be used as home', () => {
      cy.contains('a', 'Pages').click();
      cy.contains('Add page').click();
      cy.clearAndType('input[name="title"]', 'Custom home page');
      cy.contains('Markdown').click();
      cy.get('div[data-mode-id="html"]').type(
        '<h1>Custom HomePage header</h1><div class="myDiv">contents</div>',
        { parseSpecialCharSequences: false, delay: 0 }
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

    it('should render the custom page as home page', () => {
      cy.visit('http://localhost:3000');
      cy.reload();
      cy.get('h1').contains('Custom HomePage header');
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

  describe('Page edition', () => {
    it('should display existing code in an editor', () => {
      cy.contains('a', 'Settings').click();
      cy.contains('a', 'Pages').click();
      cy.contains('Country page')
        .parent()
        .within(() => {
          cy.contains('button', 'Edit').click();
        });
      cy.contains('Markdown').click();
      cy.get('div[data-mode-id="html"]').should('exist');
      cy.contains('<EntityData');
      cy.contains('Javascript').click();
      cy.contains('toISOString');
      cy.get('div[data-mode-id="javascript"]').should('exist');
    });

    it('should allow to edit and get a preview of the page', () => {
      cy.contains('a', 'Pages').click();
      cy.contains('Page with error')
        .parent()
        .within(() => {
          cy.contains('button', 'Edit').click();
        });
      cy.contains('View page').invoke('attr', 'target', '_self').click();
      cy.location('pathname', { timeout: 500 }).should('include', 'page-with-error');
      cy.contains('This content may not work correctly.');
      cy.on('uncaught:exception', (_err, _runnable) => {
        cy.contains('There is an unexpected error on this custom page');
        return false;
      });
    });

    it('should validate an empty title', () => {
      cy.contains('a', 'Settings').click();
      cy.contains('a', 'Pages').click();
      cy.contains('a', 'Add page').click();
      cy.get('input[name="title"]').clear();
      cy.contains('button.bg-success-700', 'Save').click();
      cy.get('label[for="title"].text-error-700').siblings().contains('This field is required');
    });

    it('should confirm exit if there are unsaved changes', () => {
      cy.contains('button', 'Cancel').click();
      cy.contains('Discard changes?');
      cy.contains('div[role="dialog"] button', 'Cancel').click();
      cy.contains('a', 'Pages').click();
      cy.contains('Discard changes?');
      cy.contains('button', 'Discard changes').click();
    });
  });

  describe('entity view', () => {
    it('should create a page as an entity view', () => {
      cy.contains('Add page').click();
      cy.clearAndType('input[name="title"]', 'My entity view page');
      cy.contains('Activate').click();
      cy.contains('Markdown').click();
      cy.get('div[data-mode-id="html"]').type(contents, {
        parseSpecialCharSequences: false,
        delay: 0,
      });
      cy.contains('Javascript').click();
      cy.get('div[data-mode-id="javascript"]').type(script, {
        parseSpecialCharSequences: false,
        delay: 0,
      });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000);
      cy.contains('button.bg-success-700', 'Save').click();
      cy.waitForNotification('Saved successfully');
    });

    it('should set the entity as entity view', () => {
      cy.contains('a', 'Templates').click();
      cy.contains('a', 'Medida Provisional').click();
      cy.get('.slider').click();
      cy.contains('Select...');
      cy.get('select.form-control').select('My entity view page');
      cy.contains('Save').click();
      cy.contains('Saved successfully.');
    });

    it('display the entity in custom page', () => {
      cy.contains('a', 'Library').click();
      cy.contains('.multiselectItem-name > span', 'Medida Provisional').click();
      cy.contains('Acevedo Jaramillo');
      cy.get('.item-document:nth-child(2) > .item-info').click();
      cy.contains('.side-panel.is-active > .sidepanel-footer > div > a', 'View').click();
      cy.get('.page-viewer.document-viewer').toMatchImageSnapshot();
      cy.get('#entity-datasets-value').scrollIntoView();
      cy.get('.page-viewer.document-viewer').toMatchImageSnapshot();
    });

    it('should run the scripts of a page', () => {
      cy.visit('localhost:3000');
      cy.contains('.multiselectItem-name > span', 'País').click();
      cy.get('.item-document:nth-child(2) > .item-info').click();
      cy.contains('.side-panel.is-active > .sidepanel-footer > div > a', 'View').click();
      cy.get('.page-viewer.document-viewer').toMatchImageSnapshot();
    });
  });

  describe('Pages list', () => {
    const deletePage = (selector: string) => {
      cy.get(selector).check();
      cy.contains('Delete').click();
      cy.contains('Accept').click();
    };

    it('should render a list with all pages names', () => {
      cy.contains('a', 'Settings').click();
      cy.contains('a', 'Pages').click();
      cy.contains('Country page');
      cy.get('[data-testid="settings-content"] [data-testid="table"]').toMatchImageSnapshot();
    });

    it('should allow to cancel deletion', () => {
      cy.contains('a', 'Pages').click();
      cy.get('table > tbody > tr:nth-child(4) > td > label > input').check();
      cy.contains('Delete').click();
      cy.contains('Are you sure?');
      cy.contains('div[role="dialog"] button', 'Cancel').click();
      cy.contains('Deleted successfully').should('not.exist');
      cy.contains('Page with error');
    });

    it('should delete a page with confirmation', () => {
      deletePage('table > tbody > tr:nth-child(4) > td > label > input');
      cy.contains('Deleted successfully');
      cy.contains('Page with error').should('not.exist');
    });

    it('should not delete a page used as entity view', () => {
      deletePage('table > tbody > tr:nth-child(1) > td > label > input');
      cy.contains('An error occurred');
      cy.contains('Country page');
    });
  });
});
