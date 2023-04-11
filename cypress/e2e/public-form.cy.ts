import { selectRestrictedEntities } from './helpers';
import { englishLoggedInUwazi, logout } from './helpers/login';

describe('Public Form', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-puppeteer-fixtures', { env });
    englishLoggedInUwazi();
  });

  after(() => {
    logout();
  });

  it('should white list the templates', () => {
    cy.contains('a', 'Settings').click();
    cy.contains('a', 'Collection').click();
    cy.get('.settings-content').scrollTo('bottom');
    cy.get('#collectionSettings label.toggleButton').eq(9).click();
    cy.get('input[placeholder="Search item"]').type('Mecanismo');
    cy.contains('span', 'Mecanismo').click();
    cy.get('input[placeholder="Search item"]').clear();
    cy.get('input[placeholder="Search item"]').type('Reporte');
    cy.contains('span', 'Reporte').click();
    cy.get('input[placeholder="Search item"]').clear();
    cy.get('#collectionSettings .row').eq(16).scrollIntoView();
    cy.get('#collectionSettings .row').eq(16).toMatchImageSnapshot();
    cy.contains('button', 'Save').click();
    cy.get('.alert.alert-success').click();
  });

  it('should create a page with a public form', () => {
    // cy.contains('a', 'Settings').click();
    cy.contains('a', 'Pages').click();
    cy.contains('a', 'Add page').click();
    cy.get('[name="page.data.title"]').type('Public Form Page');
    cy.get('.markdownEditor textarea').type('<PublicForm template="58ada34c299e82674854504b" />');
    cy.contains('button', 'Save').click();
    cy.get('.alert.alert-success').click();
    cy.get('.alert-info:nth-child(2) a').then($element => {
      const url = $element.attr('href')!.replace('http://localhost:3000', '');

      cy.contains('a', 'Menu').click();
      cy.contains('button', 'Add link').click();
      cy.get('.input-group:nth-child(2) input').clear();
      cy.get('.input-group:nth-child(2) input').type('Public Form Link');
      cy.get('.input-group:nth-child(1) input').type(url);
      cy.contains('button', 'Save').click();
      cy.get('.alert.alert-success').click();
    });
  });

  it('should visit the page and do a submit for the first template', () => {
    cy.contains('a', 'Public Form Link').click();
    cy.get('input[name="publicform.title"]').type('Test public submit entity');
    cy.get('input[name="publicform.metadata.resumen"]').type('This was submited via public form');
    cy.contains('span', 'Bahamas').click();
    cy.get('.captcha input').type('42hf');
    cy.get('.markdown-viewer form').toMatchImageSnapshot();
    cy.contains('button', 'Submit').click();
    cy.get('.alert.alert-success').click();
  });

  describe('public form with image and media files', () => {
    it('should go back a use the other template for the form', () => {
      cy.contains('a', 'Settings').click();
      cy.contains('a', 'Pages').click();
      cy.contains('a', 'Public Form Page').click();
      cy.get('.markdownEditor textarea').invoke('val').should('not.be.empty');
      cy.get('.markdownEditor textarea').clear();
      cy.get('.markdownEditor textarea').type('<PublicForm template="624b29b432bdcda07b3854b9" />');
      cy.contains('button', 'Save').click();
      cy.get('.alert.alert-success').click();
    });

    it('should revisit the page and fill the text, select and date fields', () => {
      cy.contains('a', 'Public Form Link').click();
      cy.get('input[name="publicform.title"]').type('Entity with image and media fields');
      cy.get('select').select('505e38c8-210f-45b1-a81f-aa34d933cbae');
      cy.get('.react-datepicker-wrapper input').type('2022/02/10');
      cy.get('textarea').type('A description for the report');
      cy.get('.image button[type=button]').eq(0).click();
      cy.get('div[role=dialog] input[type=file]').selectFile(`${__dirname}/test_files/batman.jpg`, {
        force: true,
      });
      cy.get('.media button[type=button]').click();
      cy.get('div[role=dialog] input[type=file]').selectFile(
        `${__dirname}/test_files/short-video.mp4`,
        {
          force: true,
        }
      );
      cy.get('.image button[type=button]').eq(2).click();
      cy.get('div[role=dialog] input[type=file]').selectFile(`${__dirname}/test_files/batman.jpg`, {
        force: true,
      });
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
      cy.get('aside.is-active').toMatchImageSnapshot();
    });

    it('should check the second entity with files', () => {
      cy.contains('h2', 'Entity with image and media fields').click();
      cy.contains('aside.is-active a', 'View').click();
      cy.get('.attachments-list-parent').eq(0).scrollIntoView();
      cy.get('.attachments-list-parent').eq(0).toMatchImageSnapshot();
    });
  });
});
