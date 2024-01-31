import { selectRestrictedEntities } from '../helpers';
import { clearCookiesAndLogin } from '../helpers/login';

describe('Public Form', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-puppeteer-fixtures', { env });
    clearCookiesAndLogin();
  });

  describe('whitelist templates', () => {
    it('should navigate to collection settings', () => {
      cy.contains('a', 'Settings').click();
      cy.contains('a', 'Collection').click();
      cy.get('select[name="defaultLibraryView"]').select('Cards');
      cy.get('[data-testid="enable-button-checkbox"]').eq(3).click();
    });

    it('should whitelist Mecanismo and Reporte', () => {
      cy.get('[data-testid="settings-collection"]').scrollTo('center');
      cy.get('[data-testid="multiselect"]')
        .eq(0)
        .within(() => {
          cy.get('button').eq(0).click();
          cy.contains('[data-testid="multiselect-popover"] li', 'Mecanismo').click();
          cy.contains('[data-testid="multiselect-popover"] li', 'Reporte').click();
        });
    });

    it('should save and check the changes', () => {
      cy.contains('button', 'Save').click();
      // cy.contains('Settings updated.');
      // cy.get('[data-testid="multiselect"]')
      //   .eq(0)
      //   .within(() => {
      //     cy.get('[data-testid="pill-comp"]').eq(1).should('have.text', 'Mecanismo');
      //     cy.get('[data-testid="pill-comp"]').eq(1).should('have.text', 'Reporte');
      //   });
    });
  });

  describe('create a page', () => {
    it('should create a page with a public form and add it to the navbar', () => {
      cy.contains('a', 'Pages').click();
      cy.contains('a', 'Add page').click();
      cy.get('[name="page.data.title"]').type('Public Form Page');
      cy.get('.markdownEditor textarea').type(
        '<h1>Public form submition</h1><PublicForm template="58ada34c299e82674854504b" />'
      );
      cy.intercept('POST', 'api/pages').as('savePages');
      cy.contains('button', 'Save').click();
      cy.wait('@savePages');

      let url;
      cy.get('.alert-info:nth-child(2) a').then($element => {
        url = $element.attr('href')!.replace('http://localhost:3000', '');
        cy.contains('a', 'Menu').click();

        cy.contains('button', 'Add link').click();
        cy.get('#link-title').click();
        cy.get('#link-title').type('Public Form Link');
        cy.get('#link-url').type(url);
        cy.getByTestId('menu-form-submit').click();
        cy.intercept('GET', 'api/settings/links').as('fetchLinks');
        cy.getByTestId('menu-save').click();
        cy.contains('Dismiss').click();
        cy.wait('@fetchLinks');
      });
    });

    it('should visit the page and do a submit for the first template', () => {
      cy.contains('a', 'Pages').click();
      cy.contains('a', 'Public Form Link').click();
      cy.contains('h1', 'Public form submition');
      cy.get('body').toMatchImageSnapshot();
      cy.get('input[name="publicform.title"]').type('Test public submit entity', { force: true });
      cy.get('input[name="publicform.metadata.resumen"]').type(
        'This was submited via public form',
        { force: true }
      );
      cy.contains('span', 'Bahamas').click();
      cy.get('.captcha input').type('42hf');
      cy.contains('button', 'Submit').click();
      cy.get('.alert.alert-success').click();
    });
  });

  describe('public form with image and media files', () => {
    it('should go back a use the other template for the form', () => {
      cy.contains('a', 'Settings').click();
      cy.contains('a', 'Pages').click();
      cy.contains('a', 'Public Form Page').click();
      cy.get('.markdownEditor textarea').invoke('val').should('not.be.empty');
      cy.get('.markdownEditor textarea').clear();
      cy.get('.markdownEditor textarea').type(
        '<h1>Public form submition</h1><PublicForm template="624b29b432bdcda07b3854b9" />'
      );
      cy.contains('button', 'Save').click();
      cy.get('.alert.alert-success').click();
    });

    it('should revisit the page and fill the text, select and date fields', () => {
      cy.contains('a', 'Public Form Link').click();
      cy.contains('h1', 'Public form submition');
      cy.get('body').toMatchImageSnapshot();
      cy.get('input[name="publicform.title"]').type('Entity with image and media fields', {
        force: true,
      });
      cy.get('select').select('505e38c8-210f-45b1-a81f-aa34d933cbae');
      cy.get('.react-datepicker-wrapper input').type('2022/02/10');
      cy.get('textarea').type('A description for the report');
    });

    it('should fill the Fotografía field', () => {
      cy.contains('.image button[type=button]', 'Add file').eq(0).click();
      cy.contains('button', 'Select from computer');
      cy.get('div[role=dialog] input[type=file]').selectFile('./cypress/test_files/batman.jpg', {
        force: true,
      });
      cy.get('img').should('be.visible');
    });

    it('should fill the Video field', () => {
      cy.get('.media button[type=button]').click();
      cy.contains('button', 'Select from computer');
      cy.get('div[role=dialog] input[type=file]').selectFile(
        './cypress/test_files/short-video.mp4',
        {
          force: true,
        }
      );
      cy.get('video', { timeout: 2000 }).then(async $video => {
        $video[0].pause();
        $video[0].currentTime = 0;
        $video[0].removeAttribute('controls');
      });
      cy.get('video').should('be.visible');
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000);
      cy.addTimeLink(2000, 'Control point');
    });

    it('should fill the Imagen adicional field', () => {
      cy.contains('.image button[type=button]', 'Add file').click();
      cy.contains('button', 'Select from computer');
      cy.get('div[role=dialog] input[type=file]').selectFile('./cypress/test_files/batman.jpg', {
        force: true,
      });
      cy.get('.form-group.image', { timeout: 200 }).eq(1).scrollIntoView();
    });

    it('should fill the captcha and save', () => {
      cy.get('.captcha input').type('42hf');
      cy.contains('button', 'Submit').click();
      cy.get('.alert.alert-success').click();
    });
  });

  describe('check created entities', () => {
    before(() => {
      cy.get('a[aria-label="Library"]').click();
      selectRestrictedEntities();
    });

    it('should check the first entity', () => {
      cy.contains('h2', 'Test public submit entity').click();
      cy.contains('Test public submit entity');
    });

    it('should check the second entity with files', () => {
      cy.contains('h2', 'Entity with image and media fields').click();
      cy.contains('aside.is-active a', 'View').click();
      cy.get('.attachments-list-parent').eq(0).scrollIntoView();
      cy.get('.attachments-list-parent').eq(0).toMatchImageSnapshot();
    });
  });

  describe('error handling', () => {
    it('should catch an unexpected error on rendering', () => {
      cy.contains('a', 'Settings').click();
      cy.contains('a', 'Pages').click();
      cy.contains('a', 'Add page').click();
      cy.get('[name="page.data.title"]').type('Public Form with error');
      cy.get('.markdownEditor textarea').type(
        '<h1>Public form with error</h1><PublicForm template="invalid template" />'
      );
      cy.contains('button', 'Save').click();
      cy.get('.alert.alert-success').click();
      cy.get('.alert-info:nth-child(2) a').then($element => {
        const url = $element.attr('href')!.replace('http://localhost:3000', '');
        cy.visit(url, {
          onBeforeLoad(win) {
            cy.stub(win.console, 'error').as('consoleError');
          },
        });
        cy.on('uncaught:exception', (_err, _runnable) => {
          cy.get('@consoleError').should('be.calledWithMatch', 'The template is not valid');
          cy.contains('Well, this is awkward');
          return false;
        });
      });
    });
  });
});
