import { selectRestrictedEntities } from '../helpers';
import { clearCookiesAndLogin } from '../helpers/login';

describe('Public Form', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin();
  });

  describe('whitelist templates', () => {
    it('should navigate to collection settings', () => {
      cy.contains('a', 'Settings').click();
      cy.contains('a', 'Collection').click();
      cy.get('select[name="defaultLibraryView"]').select('Cards');
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

      cy.contains('button', 'Save').click();
    });
  });

  describe('create a page', () => {
    it('should create a page with a public form and add it to the navbar', () => {
      cy.contains('a', 'Pages').click();
      cy.contains('a', 'Add page').click();
      cy.clearAndType('input[name="title"]', 'Public Form Page', { delay: 0 });
      cy.contains('Markdown').click();
      cy.get('div[data-mode-id="html"]').type(
        '<h1>Public form submition</h1><PublicForm template="58ada34c299e82674854504b" />',
        { parseSpecialCharSequences: false, delay: 0 }
      );
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(501);
      cy.contains('[data-testid=settings-content-footer] button.bg-success-700', 'Save').click();
      cy.contains('Saved successfully').as('successMessage');
      cy.get('@successMessage').should('not.exist');
      cy.contains('Basic').click();
      cy.get('input[id="page-url"]').then(url => {
        cy.contains('a', 'Menu').click();
        cy.contains('button', 'Add link').click();
        cy.get('#link-title').click();
        cy.get('#link-title').type('Public Form Link', { delay: 0 });
        cy.get('#link-url').type(url.val() as string);
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
      cy.get('input[name="publicform.title"]').type('Test public submit entity', {
        force: true,
        delay: 0,
      });
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
      cy.contains('Public Form Page')
        .parent()
        .within(() => {
          cy.contains('button', 'Edit').click();
        });
      cy.contains('Markdown').click();
      cy.get('div[data-mode-id="html"]').type('{selectAll}{del}');
      cy.get('div[data-mode-id="html"]').type(
        '<h1>Public form submition</h1><PublicForm template="624b29b432bdcda07b3854b9" />',
        { parseSpecialCharSequences: false, delay: 0 }
      );
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(501);
      cy.contains('button.bg-success-700', 'Save').click();
      cy.contains('Saved successfully').as('successMessage');
      cy.get('@successMessage').should('not.exist');
    });

    it('should revisit the page and fill the text, select and date fields', () => {
      cy.contains('a', 'Public Form Link').click();
      cy.contains('h1', 'Public form submition');
      cy.get('body').toMatchImageSnapshot();
      cy.get('input[name="publicform.title"]').type('Entity with image and media fields', {
        force: true,
        delay: 0,
      });
      cy.get('select').select('505e38c8-210f-45b1-a81f-aa34d933cbae');
      cy.get('.react-datepicker-wrapper input').type('2022/02/10', { delay: 0 });
      cy.get('textarea').type('A description for the report', { delay: 0 });
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
      cy.contains('Success');
    });
  });

  describe('check created entities', () => {
    before(() => {
      cy.get('a[aria-label="Library"]').click();
      cy.contains('Published', { timeout: 100 });
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
    // eslint-disable-next-line max-statements
    it('should catch an unexpected error on rendering', () => {
      cy.contains('a', 'Settings').click();
      cy.contains('a', 'Pages').click();
      cy.contains('a', 'Add page').click();
      cy.clearAndType('input[name="title"]', 'Public Form with error', { delay: 0 });
      cy.contains('Markdown').click();
      cy.get('div[data-mode-id="html"]').type('{selectAll}{del}', { delay: 0 });
      cy.get('div[data-mode-id="html"]').type(
        '<h1>Public form with error</h1><PublicForm template="invalid template" />',
        { parseSpecialCharSequences: false }
      );
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(501);
      cy.contains('button.bg-success-700', 'Save').click();
      cy.contains('Saved successfully');
      cy.contains('Basic').click();
      cy.get('input[id="page-url"]').then(url => {
        cy.visit(url.val() as string);
        cy.on('uncaught:exception', (_err, _runnable) => {
          cy.contains('Well, this is awkward');
          return false;
        });
      });
    });
  });
});
