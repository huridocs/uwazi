import {
  clearCookiesAndLogin,
  saveEntity,
  createTemplate,
  waitForLegacyNotifications,
} from '../helpers';

describe('Entity with main document', () => {
  let entitySharedId: string;

  before(() => {
    cy.blankState();
    clearCookiesAndLogin('admin', 'change this password now');
  });

  describe('setup', () => {
    it('should log in as admin then click the settings nav button.', () => {
      cy.contains('a', 'Settings').click();
      cy.url().should('include', '/en/settings/account');
    });

    it('should create a template with a few basic properties', () => {
      createTemplate('Template for documents', ['Text', 'Date'], '00b894');
    });

    it('should navigate to the library', () => {
      cy.contains('a', 'Library').click();
      cy.get('button').contains('Create entity').should('be.visible');
    });

    it('should create an entity with a document', () => {
      cy.get('button').contains('Create entity').click();
      cy.get('textarea[name="library.sidepanel.metadata.title"]').should('not.be.disabled');
      cy.get('textarea[name="library.sidepanel.metadata.title"]').type('Entity with document 1', {
        delay: 0,
      });
      cy.contains('#metadataForm', 'Type').get('select').eq(0).select('Template for documents');
      cy.get('.form-group.text input').type('Entity 1 text', { delay: 0 });

      cy.contains('.form-group.date', 'Date').within(() => {
        cy.get('input').type('08/09/1966', { delay: 0 });
      });

      cy.get('.document-list-parent > input')
        .first()
        .selectFile('./cypress/test_files/anotherPDF.pdf', { force: true });

      saveEntity();
      waitForLegacyNotifications();
    });

    it('should check the entity was created and get the link for it', () => {
      cy.contains('div', 'Entity with document 1')
        .parent()
        .within(() => {
          cy.contains('a', 'View')
            .should('have.attr', 'href')
            .then(href => {
              // eslint-disable-next-line prefer-destructuring
              entitySharedId = (href as unknown as string).split('/')[3];
            });
        });
    });
  });

  describe('document and text layer', { viewportWidth: 1138, viewportHeight: 640 }, () => {
    it('should visit the entity ', () => {
      cy.visit(`/en/entityv2/${entitySharedId}`);
    });

    it('should display the PDF', () => {
      // wait for pdf to render
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.contains('div[class="page"]', 'RESOLUCIÓN DE LA PRESIDENTA DE LA').should('be.visible');
      cy.get('div[id="root"]').matchImageSnapshot('Verify correct rendering of pdf and panels');
    });

    it('should switch to the text layer', () => {
      cy.contains('select', 'PDF').select('Plain text');

      cy.contains('div[class=" whitespace-pre-line"]', 'RESOLUCIÓN DE LA PRESIDENTA DE LA').should(
        'be.visible'
      );
    });

    it('should be able to see the next page', () => {
      //the a tags are for SEO and screen readers, therefore hidden
      cy.contains('a', 'Next').click({ force: true });
      cy.contains(
        'div[class=" whitespace-pre-line"]',
        'Esta Presidencia ha constatado que, mediante transferencia realizada el 15 de'
      ).should('be.visible');
    });

    it('should switch the the pdf view and be on the correct page', () => {
      cy.contains('select', 'PDF').select('PDF');
      cy.contains('div[class="page"]', 'Esta Presidencia').should('be.visible');
    });

    it('should be able to paginate forward and backward', () => {
      cy.contains('a', 'Next').click({ force: true });
      cy.contains('div[class="page"]', 'Elizabeth Odio Benito').should('be.visible');
      cy.contains('a', 'Previous').click({ force: true });
      cy.contains('a', 'Previous').click({ force: true });
      cy.contains('div[class="page"]', 'RESOLUCIÓN DE LA PRESIDENTA DE LA').should('be.visible');
    });

    it('should render on the correct page based on the url', () => {
      cy.visit(`en/entityv2/${entitySharedId}?page=3`);
      cy.contains('div[class="page"]', 'Elizabeth Odio Benito').should('be.visible');
    });

    it('should switch to the metadata tab and back and still be on the correct page', () => {
      cy.contains('button', 'Metadata').eq(0).click();
      cy.contains('dd', 'Entity with document 1');
      cy.contains('button', 'Document').click();
      cy.contains('div[class="page"]', 'Elizabeth Odio Benito').should('be.visible');
    });
  });

  describe('search', () => {
    it('should navigate with a search term', () => {
      cy.visit(`/en/entityv2/${entitySharedId}?searchTerm=Rep%C3%BAblica%20de%20Nicaragua`);
      cy.contains('div[class="page"]', 'RESOLUCIÓN DE LA PRESIDENTA DE LA').should('be.visible');
    });

    it('should display search results', () => {
      cy.contains(
        'p',
        'del Fondo de Asistencia Legal de Víctimas, RESUELVE: 1. Declarar que la República de Nicaragua ha cumplido con reintegrar al Fondo de Asistencia Legal de Víctimas de la'
      ).click();

      cy.contains('mark', 'República').should('be.visible');
      cy.contains('mark', 'Nicaragua').should('be.visible');
    });
  });

  describe('responsive', { viewportWidth: 450, viewportHeight: 650 }, () => {
    it('should view the file in mobile view', () => {
      cy.visit(`/en/entityv2/${entitySharedId}?page=2`);
      //wait for page to render
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.get('div[id="root"]').matchImageSnapshot('PDF on mobile view');
    });
  });
});
