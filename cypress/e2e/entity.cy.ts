/* eslint-disable max-lines */
/*global page*/

import { clearCookiesAndLogin } from './helpers/login';
// import disableTransitions from '../helpers/disableTransitions';
// import { uploadFileInMetadataField, scrollTo } from '../helpers/formActions';
// import { uploadSupportingFileToEntity } from '../helpers/createEntity';
// import { goToRestrictedEntities } from '../helpers/publishedFilter';
// import { refreshIndex } from '../helpers/elastichelpers';
// import { checkStringValuesInSelectors, getContentBySelector } from '../helpers/selectorUtils';
// import { changeLanguage } from '../helpers/changeLanguage';
// import { host } from '../config';

const entityTitle = 'Entity with supporting files';
const textWithHtml = `<h1>The title</h1>
  <a href="https://duckduckgo.com/" target="_blank">
    I am a link to an external site
  </a>
  <br />
  <a href="/entity/4yl59bcq71ra4i">
    I am a link to the internal Ecuador entity
  <a/>
  <ol class="someClass">
    <li>List item 1</li>
    <li>List item 2</li>
  </ol>`;

const clickOnCreateEntity = () => {
  cy.intercept('GET', 'api/thesauris').as('fetchThesauri');
  cy.contains('button', 'Create entity').click();
  cy.wait('@fetchThesauri');
};

const clickOnEditEntity = () => {
  cy.intercept('GET', 'api/thesauris').as('fetchThesauri');
  cy.contains('button', 'Edit').click();
  cy.wait('@fetchThesauri');
};

const goToRestrictedEntities = () => {
  cy.visit('http://localhost:3000');
  cy.get('#publishedStatuspublished').then(element => {
    const publishedStatus = element.val();
    cy.get('#publishedStatusrestricted').then(restrictedElement => {
      const restrictedStatis = restrictedElement.val();

      if (publishedStatus) {
        cy.get('[title="Published"]').click();
      }

      if (!restrictedStatis) {
        cy.get('[title="Restricted"]').click();
      }
    });
  });
};

describe('Entities', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-puppeteer-fixtures', { env });
    clearCookiesAndLogin();
  });

  it('Should create new entity', () => {
    clickOnCreateEntity();
    cy.get('[name="library.sidepanel.metadata.title"]').click();
    cy.get('[name="library.sidepanel.metadata.title"]').type('Test title', { force: true });
    cy.contains('button', 'Save').click();
  });

  describe('Rich text fields', () => {
    it('should create an entity with HTML on a rich text field', () => {
      clickOnCreateEntity();
      cy.get('[name="library.sidepanel.metadata.title"]').click();
      cy.get('[name="library.sidepanel.metadata.title"]').type('Entity with HTML', { force: true });
      cy.get('#metadataForm').find('select').select('Reporte', { force: true });

      cy.get('#tabpanel-edit > textarea').type(textWithHtml);
      cy.contains('button', 'Save').click();
    });

    it('should check that the HTML is show as expected', () => {
      cy.contains('h1', 'The title').should('exist');
      cy.contains('a', 'I am a link to an external site').should('exist');
      cy.contains('.someClass > li:nth-child(1)', 'List item 1').should('exist');
      cy.contains('.someClass > li:nth-child(2)', 'List item 2').should('exist');
    });

    it('should navigate to an entity via the rich text field link', () => {
      cy.contains('a', 'I am a link to the internal Ecuador entity').click();
      cy.contains('.content-header-title > h1:nth-child(1)', 'Ecuador').should('exist');
    });
  });

  describe('Entity with files in metadata fields', () => {
    it('should create and entity with and image in a metadata field', () => {
      goToRestrictedEntities();
      clickOnCreateEntity();
      cy.get('[name="library.sidepanel.metadata.title"]').click();
      cy.get('[name="library.sidepanel.metadata.title"]').type('Entity with media files', {
        force: true,
      });
      cy.get('#metadataForm').find('select').select('Reporte', { force: true });
      cy.get('#tabpanel-edit > textarea').type('A description of the report');
      cy.get(
        '#metadataForm > div:nth-child(3) > div:nth-child(4) > ul > li.wide > div > div > div > button'
      ).click();
      cy.get('input[aria-label=fileInput]').first().selectFile('./cypress/test_files/batman.jpg', {
        force: true,
      });
      cy.contains('button', 'Save').click();
    });

    it('should edit the entity to add a video on a metadata field', () => {
      cy.contains('.item-document', 'Entity with media files').click();
      clickOnEditEntity();
      // cy.get('.sidepanel-body.scrollable').scrollTo('center');
      cy.get(
        '#metadataForm > div:nth-child(3) > div.form-group.media > ul > li.wide > div > div > div > button'
      ).click();
      cy.get('input[aria-label=fileInput]')
        .first()
        .selectFile('./cypress/test_files/short-video.webm', {
          force: true,
        });
      cy.contains('button', 'Save').click();
    });

    it('should check the entity', () => {
      // await page.goto(`${host}/library`);
      // await goToRestrictedEntities();
      goToRestrictedEntities();
      // await expect(page).toClick('.item-name span', {
      //   text: 'Entity with media files',
      // });
      cy.contains('.item-name span', 'Entity with media files').click();
      // await page.waitForSelector('#tabpanel-metadata video');
      // await expect(page).toMatchElement('.metadata-name-descripci_n > dd > div > p', {
      //   text: 'A description of the report',
      // });
      cy.get('.metadata-name-descripci_n > dd > div > p').should(
        'contain.text',
        'A description of the report'
      );
      // const [fotografiaFieldSource] = await page.$$eval(
      //   '.metadata-name-fotograf_a > dd > img',
      //   el => el.map(x => x.getAttribute('src'))
      // );

      cy.get('.metadata-name-fotograf_a > dd > img')
        .should('have.prop', 'src')
        .and('match', /\w+\/api\/files\/\w+\.jpg$/);
      // const [videoFieldSource] = await page.$$eval(
      //   '.metadata-name-video > dd > div > div > div > div:nth-child(1) > div > video',
      //   el => el.map(x => x.getAttribute('src'))
      // );
      cy.get('.metadata-name-video > dd > div > div > div > div:nth-child(1) > div > video')
        .should('have.prop', 'src')
        .and('match', /^blob:http:\/\/localhost:3000\/[\w-]+$/);
      // await checkStringValuesInSelectors([
      //   { selector: fotografiaFieldSource, expected: /^\/api\/files\/\w+\.jpg$/ },
      //   { selector: videoFieldSource, expected: /^blob:http:\/\/localhost:3000\/[\w-]+$/ },
      // ]);
      // const fileList = await getContentBySelector('.attachment-name span:not(.attachment-size)');
      // expect(fileList).toEqual(['batman.jpg', 'short-video.webm']);
    });
  });

  describe('supporting files and main documents', () => {
    describe('Entity with supporting files', () => {
      it('Should create a new entity with supporting files', () => {
        // await goToRestrictedEntities();
        // await createEntityWithSupportingFiles(entityTitle, filesAttachments, webAttachments);
        // await expect(page).toClick('.item-document', {
        //   text: entityTitle,
        // });
        // const fileList = await getContentBySelector('.attachment-name span:not(.attachment-size)');
        // expect(fileList).toEqual(['batman.jpg', 'Resource from web', 'valid.pdf']);
      });

      it('should rename a supporting file', () => {
        // await expect(page).toClick('.item-document', {
        //   text: entityTitle,
        // });
        // await expect(page).toClick('button', { text: 'Edit' });
        // await expect(page).toFill(
        //   'input[name="library.sidepanel.metadata.attachments.2.originalname"]',
        //   'My PDF.pdf'
        // );
        // await saveEntityAndClosePanel();
        // await expect(page).toClick('.item-document', {
        //   text: entityTitle,
        // });
        // const fileList = await getContentBySelector('.attachment-name span:not(.attachment-size)');
        // expect(fileList).toEqual(['batman.jpg', 'My PDF.pdf', 'Resource from web']);
      });

      it('should delete the first supporting file', () => {
        // await expect(page).toClick('.item-document', {
        //   text: entityTitle,
        // });
        // await expect(page).toClick('button', { text: 'Edit' });
        // await expect(page).toClick('.delete-supporting-file');
        // await saveEntityAndClosePanel();
        // await expect(page).toClick('.item-document', {
        //   text: entityTitle,
        // });
        // await page.waitForSelector('.attachment-name');
        // const fileList = await getContentBySelector('.attachment-name span:not(.attachment-size)');
        // expect(fileList).toEqual(['My PDF.pdf', 'Resource from web']);
      });
    });

    describe('Entity with main documents', () => {
      it('Should create a new entity with a main documents', () => {
        // await goToRestrictedEntities();
        // await expect(page).toClick('button', { text: 'Create entity' });
        // await expect(page).toFill(
        //   'textarea[name="library.sidepanel.metadata.title"]',
        //   'Entity with main documents'
        // );
        // await expect(page).toFill(
        //   'input[name="library.sidepanel.metadata.metadata.resumen"]',
        //   'An entity with main documents'
        // );
        // await expect(page).toUploadFile(
        //   '.document-list-parent > input',
        //   `${__dirname}/../test_files/valid.pdf`
        // );
        // await saveEntityAndClosePanel();
      });

      it('should edit the entity and the documents', () => {
        // await expect(page).toClick('.item-document', {
        //   text: 'Entity with main documents',
        // });
        // await expect(page).toMatchElement('.metadata-type-text', {
        //   text: 'An entity with main documents',
        // });
        // await expect(page).toClick('button', { text: 'Edit' });
        // await expect(page).toFill(
        //   'input[name="library.sidepanel.metadata.documents.0.originalname"]',
        //   'Renamed file.pdf'
        // );
        // await expect(page).toUploadFile(
        //   '.document-list-parent > input',
        //   `${__dirname}/../test_files/invalid.pdf`
        // );
        // await saveEntityAndClosePanel();
        // await expect(page).toClick('.item-document', {
        //   text: 'Entity with main documents',
        // });
        // await page.waitForSelector('.file-originalname');
        // await expect(page).toMatchElement('.file-originalname', { text: 'Renamed file.pdf' });
        // await expect(page).toMatchElement('.file-originalname', { text: 'invalid.pdf' });
      });

      it('should delete the invalid document', () => {
        // await expect(page).toClick('button', { text: 'Edit' });
        // await expect(page).toClick('.attachments-list > .attachment:nth-child(2) > button');
        // await saveEntityAndClosePanel();
        // await expect(page).toClick('.item-document', {
        //   text: 'Entity with main documents',
        // });
        // await expect(page).toMatchElement('.file-originalname', { text: 'Renamed file.pdf' });
        // await expect(page).not.toMatchElement('.file-originalname', { text: 'invalid.pdf' });
      });
    });
  });

  describe('Languages', () => {
    it('should change the entity in Spanish', () => {
      // await changeLanguage('Español');
      // await expect(page).toClick('.item-document', {
      //   text: 'Test title',
      // });
      // await expect(page).toClick('button', { text: 'Editar' });
      // await expect(page).toFill(
      //   'textarea[name="library.sidepanel.metadata.title"]',
      //   'Título de prueba'
      // );
      // await expect(page).toFill(
      //   'input[name="library.sidepanel.metadata.metadata.resumen"]',
      //   'Resumen en español'
      // );
      // await expect(page).toClick('.multiselectItem-name', { text: 'Argentina' });
      // await saveEntityAndClosePanel('Guardar');
    });

    it('should check the values for the entity in Spanish', () => {
      // await expect(page).toClick('.item-document', {
      //   text: 'Título de prueba',
      // });
      // await expect(page).toMatchElement('h1.item-name', {
      //   text: 'Título de prueba',
      // });
      // await expect(page).toMatchElement('.metadata-type-text > dd', {
      //   text: 'Resumen en español',
      // });
      // await expect(page).toMatchElement('.multiline > .item-value > a', {
      //   text: 'Argentina',
      // });
    });

    it('should edit the text field in English', () => {
      // await changeLanguage('English');
      // await expect(page).toClick('.item-document', {
      //   text: 'Test title',
      // });
      // await expect(page).toClick('button', { text: 'Edit' });
      // await expect(page).toFill(
      //   'input[name="library.sidepanel.metadata.metadata.resumen"]',
      //   'Brief in English'
      // );
      // await saveEntityAndClosePanel();
      // await expect(page).toClick('.item-document', {
      //   text: 'Test title',
      // });
      // await expect(page).toMatchElement('.metadata-type-text > dd', {
      //   text: 'Brief in English',
      // });
      // await expect(page).toMatchElement('.multiline > .item-value > a', {
      //   text: 'Argentina',
      // });
    });

    it('should not affect the text field in Spanish', () => {
      // await changeLanguage('Español');
      // await expect(page).toClick('.item-document', {
      //   text: 'Título de prueba',
      // });
      // await expect(page).toMatchElement('.metadata-type-text > dd', {
      //   text: 'Resumen en español',
      // });
    });
  });

  describe('new thesauri values shortcut', () => {
    before(() => {
      // await changeLanguage('English');
      // await expect(page).toClick('li[title=Published]');
      // await expect(page).toMatchElement('span', { text: 'Ordenes de la corte' });
      // await expect(page).toClick('span', { text: 'Ordenes de la corte' });
      // await expect(page).toClick('.item-document', {
      //   text: 'Artavia Murillo y otros. Resolución de la Corte IDH de 31 de marzo de 2014',
      // });
      // await expect(page).toClick('button.edit-metadata', { text: 'Edit' });
    });

    it('should add a thesauri value on a multiselect field and select it', () => {
      // await expect(page).toClick(
      //   '#metadataForm > div:nth-child(3) > .form-group.multiselect > ul > .wide > div > div > button > span',
      //   { text: 'add value' }
      // );
      // await expect(page).toFill('input[name=value]#newThesauriValue', 'New Value');
      // await expect(page).toClick('.confirm-button', { text: 'Save' });
      // await expect(page).toMatchElement(
      //   '#metadataForm > div:nth-child(3) > .form-group.multiselect > ul > .wide > div > ul > li:nth-child(4) > label > .multiselectItem-name',
      //   { text: 'New Value' }
      // );
      // const selectedItems = await getContentBySelector(
      //   '#metadataForm > div:nth-child(3) > .form-group.multiselect > ul > li.wide > div > ul > li > label > .multiselectItem-name'
      // );
      // expect(selectedItems).toEqual([
      //   'De asunto',
      //   'Medidas Provisionales',
      //   'New Value',
      //   'Excepciones Preliminares',
      //   'Fondo',
      // ]);
    });

    it('should add a thesauti value on a single select field and select it', () => {
      // await expect(page).toClick(
      //   '#metadataForm > div:nth-child(3) > .form-group.select > ul > .wide > div > div > button > span',
      //   { text: 'add value' }
      // );
      // await expect(page).toFill('input[name=value]#newThesauriValue', 'New Value');
      // await expect(page).toClick('.confirm-button', { text: 'Save' });
    });
  });
});
