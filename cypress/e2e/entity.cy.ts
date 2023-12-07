/* eslint-disable max-lines */
/*global page*/

import { clearCookiesAndLogin } from './helpers/login';
// import disableTransitions from '../helpers/disableTransitions';
// import { uploadFileInMetadataField, scrollTo } from '../helpers/formActions';
// import { uploadSupportingFileToEntity } from '../helpers/createEntity';
// import { goToRestrictedEntities } from '../helpers/publishedFilter';
// import { refreshIndex } from '../helpers/elastichelpers';
// import { checkStringValuesInSelectors, getContentBySelector } from '../helpers/selectorUtils';
import { changeLanguage } from './helpers/language';
// import { host } from '../config';

const host = 'http://localhost:3000';

const filesAttachments = [`./cypress/test_files/valid.pdf`, `./cypress/test_files/batman.jpg`];

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

const webAttachments = {
  name: 'Resource from web',
  url: 'https://fonts.googleapis.com/icon?family=Material+Icons',
};

const clickOnCreateEntity = () => {
  cy.intercept('GET', 'api/thesauris').as('fetchThesauri');
  cy.contains('button', 'Create entity').click();
  cy.wait('@fetchThesauri');
};

const clickOnEditEntity = (buttonTitle: string = 'Edit') => {
  cy.intercept('GET', 'api/thesauris').as('fetchThesauri');
  cy.contains('button', buttonTitle).click();
  cy.wait('@fetchThesauri');
};

const goToRestrictedEntities = () => {
  cy.visit(host);
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
      cy.visit(`${host}/library`);
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
      // await checkStringValuesInSelectors([
      //   { selector: fotografiaFieldSource, expected: /^\/api\/files\/\w+\.jpg$/ },
      //   { selector: videoFieldSource, expected: /^blob:http:\/\/localhost:3000\/[\w-]+$/ },
      // ]);
      cy.get('.metadata-name-video > dd > div > div > div > div:nth-child(1) > div > video')
        .should('have.prop', 'src')
        .and('match', /^blob:http:\/\/localhost:3000\/[\w-]+$/);
      // const fileList = await getContentBySelector('.attachment-name span:not(.attachment-size)');
      // expect(fileList).toEqual(['batman.jpg', 'short-video.webm']);
      const expectedNewEntityFiles = ['batman.jpg', 'short-video.webm'];
      cy.get('.attachment-name span:not(.attachment-size)').each((element, index) => {
        const content = element.text();
        cy.wrap(content).should('eq', expectedNewEntityFiles[index]);
      });
    });
  });

  describe('supporting files and main documents', () => {
    describe('Entity with supporting files', () => {
      it('Should create a new entity with supporting files', () => {
        // await goToRestrictedEntities();
        goToRestrictedEntities();
        // await createEntityWithSupportingFiles(entityTitle, filesAttachments, webAttachments);
        clickOnCreateEntity();
        cy.contains('button', 'Add file').click();
        cy.get('#tab-uploadComputer').click();
        cy.get('input[aria-label="fileInput"]').first().selectFile(filesAttachments[0], {
          force: true,
        });
        cy.contains('button', 'Add file').click();
        cy.get('#tab-uploadComputer').click();
        cy.get('input[aria-label="fileInput"]').first().selectFile(filesAttachments[1], {
          force: true,
        });
        // await expect(page).toClick('button', { text: 'Create entity' });
        clickOnCreateEntity();
        // await expect(page).toFill('textarea[name="library.sidepanel.metadata.title"]', title);
        cy.get('[name="library.sidepanel.metadata.title"]').click();
        cy.get('[name="library.sidepanel.metadata.title"]').type(entityTitle, {
          force: true,
        });
        // await addSupportingFile(files[0]);
        cy.contains('button', 'Add file').click();
        cy.get('#tab-uploadComputer').click();
        cy.get('input[aria-label="fileInput"]').first().selectFile(filesAttachments[0], {
          force: true,
        });
        // await addSupportingFile(files[1]);
        cy.contains('button', 'Add file').click();
        cy.get('#tab-uploadComputer').click();
        cy.get('input[aria-label="fileInput"]').first().selectFile(filesAttachments[1], {
          force: true,
        });
        // await expect(page).toClick('button', { text: 'Add file' });
        cy.contains('button', 'Add file').click();
        // await expect(page).toClick('.tab-link', { text: 'Add from web' });
        cy.contains('.tab-link', 'Add from web').click();
        // await expect(page).toFill('.web-attachment-url', webAttachment.url);
        cy.get('.web-attachment-url').click();
        cy.get('.web-attachment-url').type(webAttachments.url, { force: true });
        // await expect(page).toFill('.web-attachment-name', webAttachment.name);
        cy.get('.web-attachment-name').click();
        cy.get('.web-attachment-name').type(webAttachments.name, { force: true });
        // await expect(page).toClick('button', { text: 'Add from URL' });
        cy.contains('button', 'Add from URL').click();

        // await saveEntityAndClosePanel();
        cy.contains('button', 'Save').click();
        // await expect(page).toClick('.item-document', {
        //   text: entityTitle,
        // });
        cy.contains('.item-document', entityTitle).click();
        // const fileList = await getContentBySelector('.attachment-name span:not(.attachment-size)');
        // expect(fileList).toEqual(['batman.jpg', 'Resource from web', 'valid.pdf']);
        const expectedNewFiles = ['batman.jpg', 'Resource from web', 'valid.pdf'];
        cy.get('.attachment-name span:not(.attachment-size)').each((element, index) => {
          const content = element.text();
          cy.wrap(content).should('eq', expectedNewFiles[index]);
        });
      });

      it('should rename a supporting file', () => {
        // await expect(page).toClick('.item-document', {
        //   text: entityTitle,
        // });
        cy.contains('.item-document', entityTitle).click();
        // await expect(page).toClick('button', { text: 'Edit' });
        clickOnEditEntity();
        // await expect(page).toFill(
        //   'input[name="library.sidepanel.metadata.attachments.2.originalname"]',
        //   'My PDF.pdf'
        // );
        cy.get('input[name="library.sidepanel.metadata.attachments.2.originalname"]').clear();
        cy.get('input[name="library.sidepanel.metadata.attachments.2.originalname"]').type(
          'My PDF.pdf',
          { force: true }
        );
        // await saveEntityAndClosePanel();
        cy.contains('button', 'Save').click();
        // await expect(page).toClick('.item-document', {
        //   text: entityTitle,
        // });
        cy.contains('.item-document', entityTitle).click();
        // const fileList = await getContentBySelector('.attachment-name span:not(.attachment-size)');
        // expect(fileList).toEqual(['batman.jpg', 'My PDF.pdf', 'Resource from web']);
        const expectedRenamedFiles = ['batman.jpg', 'My PDF.pdf', 'Resource from web'];
        cy.get('.attachment-name span:not(.attachment-size)').each((element, index) => {
          const content = element.text();
          console.log(content);
          cy.wrap(content).should('eq', expectedRenamedFiles[index]);
        });
      });

      it('should delete the first supporting file', () => {
        // await expect(page).toClick('.item-document', {
        //   text: entityTitle,
        // });
        cy.contains('.item-document', entityTitle).click();
        // await expect(page).toClick('button', { text: 'Edit' });
        clickOnEditEntity();
        // await expect(page).toClick('.delete-supporting-file');
        cy.get('#attachment-dropdown-actions').eq(0).click();
        cy.get('.dropdown-menu.dropdown-menu-right')
          .eq(0)
          .within(() => {
            cy.intercept('DELETE', 'api/files*').as('deleteFile');
            cy.contains('button', 'Delete').click();
            cy.contains('button', '.confirm-button').click();
            cy.wait('@deleteFile');
          });
        // await saveEntityAndClosePanel();
        cy.contains('button', 'Save').click();
        // await expect(page).toClick('.item-document', {
        //   text: entityTitle,
        // });
        cy.contains('.item-document', entityTitle).click();
        // await page.waitForSelector('.attachment-name');
        // const fileList = await getContentBySelector('.attachment-name span:not(.attachment-size)');
        // expect(fileList).toEqual(['My PDF.pdf', 'Resource from web']);
        const expectedSupportingFiles = ['My PDF.pdf', 'Resource from web'];
        cy.get('.attachment-name span:not(.attachment-size)').each((element, index) => {
          const content = element.text();
          cy.wrap(content).should('eq', expectedSupportingFiles[index]);
        });
      });
    });

    describe('Entity with main documents', () => {
      it('Should create a new entity with a main documents', () => {
        // await goToRestrictedEntities();
        goToRestrictedEntities();
        // await expect(page).toClick('button', { text: 'Create entity' });
        clickOnCreateEntity();
        // await expect(page).toFill(
        //   'textarea[name="library.sidepanel.metadata.title"]',
        //   'Entity with main documents'
        // );
        cy.get('textarea[name="library.sidepanel.metadata.title"]').click();
        cy.get('textarea[name="library.sidepanel.metadata.title"]').type(
          'Entity with main documents',
          { force: true }
        );
        // await expect(page).toFill(
        //   'input[name="library.sidepanel.metadata.metadata.resumen"]',
        //   'An entity with main documents'
        // );
        cy.get('input[name="library.sidepanel.metadata.metadata.resumen"]').click();
        cy.get('input[name="library.sidepanel.metadata.metadata.resumen"]').type(
          'An entity with main documents',
          { force: true }
        );
        // await expect(page).toUploadFile(
        //   '.document-list-parent > input',
        //   `${__dirname}/../test_files/valid.pdf`
        // );
        cy.get('.document-list-parent > input')
          .first()
          .selectFile('./cypress/test_files/valid.pdf', {
            force: true,
          });
        // await saveEntityAndClosePanel();
        cy.contains('button', 'Save').click();
      });

      it('should edit the entity and the documents', () => {
        // await expect(page).toClick('.item-document', {
        //   text: 'Entity with main documents',
        // });
        cy.contains('.item-document', 'Entity with main documents').click();
        // await expect(page).toMatchElement('.metadata-type-text', {
        //   text: 'An entity with main documents',
        // });
        cy.contains('.metadata-type-text', 'An entity with main documents').click();
        // await expect(page).toClick('button', { text: 'Edit' });
        clickOnEditEntity();
        // await expect(page).toFill(
        //   'input[name="library.sidepanel.metadata.documents.0.originalname"]',
        //   'Renamed file.pdf'
        // );
        cy.get('input[name="library.sidepanel.metadata.documents.0.originalname"]').click();
        cy.get('input[name="library.sidepanel.metadata.documents.0.originalname"]').type(
          'Renamed file.pdf',
          { force: true }
        );
        // await expect(page).toUploadFile(
        //   '.document-list-parent > input',
        //   `${__dirname}/../test_files/invalid.pdf`
        // );
        cy.get('.document-list-parent > input')
          .first()
          .selectFile('./cypress/test_files/invalid.pdf', {
            force: true,
          });
        // await saveEntityAndClosePanel();
        cy.contains('button', 'Save').click();
        // await expect(page).toClick('.item-document', {
        //   text: 'Entity with main documents',
        // });
        cy.contains('.item-document', 'Entity with main documents').click();

        // await page.waitForSelector('.file-originalname');
        // await expect(page).toMatchElement('.file-originalname', { text: 'Renamed file.pdf' });
        cy.contains('.file-originalname', 'Renamed file.pdf').should('exist');
        // await expect(page).toMatchElement('.file-originalname', { text: 'invalid.pdf' });
        cy.contains('.file-originalname', 'invalid.pdf').should('exist');
      });

      it('should delete the invalid document', () => {
        // await expect(page).toClick('button', { text: 'Edit' });
        clickOnEditEntity();
        // await expect(page).toClick('.attachments-list > .attachment:nth-child(2) > button');
        cy.get('.attachments-list > .attachment:nth-child(2) > button').click();
        // await saveEntityAndClosePanel();
        cy.contains('button', 'Save').click();
        // await expect(page).toClick('.item-document', {
        //   text: 'Entity with main documents',
        // });
        cy.contains('.item-document', 'Entity with main documents').click();
        // await expect(page).toMatchElement('.file-originalname', { text: 'Renamed file.pdf' });
        cy.contains('.file-originalname', 'Renamed file.pdf').should('exist');
        // await expect(page).not.toMatchElement('.file-originalname', { text: 'invalid.pdf' });
        cy.contains('.file-originalname', 'invalid.pdf').should('not.exist');
      });
    });
  });

  describe('Languages', () => {
    it('should change the entity in Spanish', () => {
      // await changeLanguage('Español');
      changeLanguage('Español');
      // await expect(page).toClick('.item-document', {
      //   text: 'Test title',
      // });
      cy.contains('.item-document', 'Test title').click();
      // await expect(page).toClick('button', { text: 'Editar' });
      clickOnEditEntity('Editar');
      // await expect(page).toFill(
      //   'textarea[name="library.sidepanel.metadata.title"]',
      //   'Título de prueba'
      // );
      cy.get('textarea[name="library.sidepanel.metadata.title"]').click();
      cy.get('textarea[name="library.sidepanel.metadata.title"]').type('Título de prueba', {
        force: true,
      });
      // await expect(page).toFill(
      //   'input[name="library.sidepanel.metadata.metadata.resumen"]',
      //   'Resumen en español'
      // );
      cy.get('input[name="library.sidepanel.metadata.metadata.resumen"]').click();
      cy.get('input[name="library.sidepanel.metadata.metadata.resumen"]').type(
        'Resumen en español',
        { force: true }
      );
      // await expect(page).toClick('.multiselectItem-name', { text: 'Argentina' });
      cy.contains('.multiselectItem-name', 'Argentina').click();
      // await saveEntityAndClosePanel('Guardar');
      cy.contains('button', 'Guardar').click();
    });

    it('should check the values for the entity in Spanish', () => {
      // await expect(page).toClick('.item-document', {
      //   text: 'Título de prueba',
      // });
      cy.contains('.item-document', 'Título de prueba').click();
      // await expect(page).toMatchElement('h1.item-name', {
      //   text: 'Título de prueba',
      // });
      cy.contains('h1.item-name', 'Título de prueba').should('exist');
      // await expect(page).toMatchElement('.metadata-type-text > dd', {
      //   text: 'Resumen en español',
      // });
      cy.contains('.metadata-type-text > dd', 'Resumen en español').should('exist');
      // await expect(page).toMatchElement('.multiline > .item-value > a', {
      //   text: 'Argentina',
      // });
      cy.contains('.multiline > .item-value > a', 'Argentina').should('exist');
    });

    it('should edit the text field in English', () => {
      // await changeLanguage('English');
      changeLanguage('English');
      // await expect(page).toClick('.item-document', {
      //   text: 'Test title',
      // });
      cy.contains('.item-document', 'Test title').click();
      // await expect(page).toClick('button', { text: 'Edit' });
      clickOnEditEntity();
      // await expect(page).toFill(
      //   'input[name="library.sidepanel.metadata.metadata.resumen"]',
      //   'Brief in English'
      // );
      cy.get('input[name="library.sidepanel.metadata.metadata.resumen"]').click();
      cy.get('input[name="library.sidepanel.metadata.metadata.resumen"]').type('Brief in English', {
        force: true,
      });
      // await saveEntityAndClosePanel();
      cy.contains('button', 'Save').click();
      // await expect(page).toClick('.item-document', {
      //   text: 'Test title',
      // });
      cy.contains('.item-document', 'Test title').click();
      // await expect(page).toMatchElement('.metadata-type-text > dd', {
      //   text: 'Brief in English',
      // });
      cy.contains('.metadata-type-text > dd', 'Brief in English').should('exist');
      // await expect(page).toMatchElement('.multiline > .item-value > a', {
      //   text: 'Argentina',
      // });
      cy.contains('.multiline > .item-value > a', 'Argentina').should('exist');
    });

    it('should not affect the text field in Spanish', () => {
      // await changeLanguage('Español');
      changeLanguage('Español');
      // await expect(page).toClick('.item-document', {
      //   text: 'Título de prueba',
      // });
      cy.contains('.item-document', 'Título de prueba').click();
      // await expect(page).toMatchElement('.metadata-type-text > dd', {
      //   text: 'Resumen en español',
      // });
      cy.contains('.metadata-type-text > dd', 'Resumen en español').should('exist');
    });
  });

  describe('new thesauri values shortcut', () => {
    before(() => {
      // await changeLanguage('English');
      changeLanguage('English');
      // await expect(page).toClick('li[title=Published]');
      cy.get('li[title=Published]').click();
      // await expect(page).toMatchElement('span', { text: 'Ordenes de la corte' });
      cy.contains('span', 'Ordenes de la corte').should('exist');
      // await expect(page).toClick('span', { text: 'Ordenes de la corte' });
      cy.contains('span', 'Ordenes de la corte').click();
      // await expect(page).toClick('.item-document', {
      //   text: 'Artavia Murillo y otros. Resolución de la Corte IDH de 31 de marzo de 2014',
      // });
      cy.contains(
        '.item-document',
        'Artavia Murillo y otros. Resolución de la Corte IDH de 31 de marzo de 2014'
      ).click();
      // await expect(page).toClick('button.edit-metadata', { text: 'Edit' });
      clickOnEditEntity();
    });

    it('should add a thesauri value on a multiselect field and select it', () => {
      // await expect(page).toClick(
      //   '#metadataForm > div:nth-child(3) > .form-group.multiselect > ul > .wide > div > div > button > span',
      //   { text: 'add value' }
      // );
      cy.contains(
        '#metadataForm > div:nth-child(3) > .form-group.multiselect > ul > .wide > div > div > button > span',
        'add value'
      ).click();
      // await expect(page).toFill('input[name=value]#newThesauriValue', 'New Value');
      cy.get('input[name=value]#newThesauriValue').click();
      cy.get('input[name=value]#newThesauriValue').type('New Value', {
        force: true,
      });
      // await expect(page).toClick('.confirm-button', { text: 'Save' });
      cy.contains('button', 'Save').click();
      // await expect(page).toMatchElement(
      //   '#metadataForm > div:nth-child(3) > .form-group.multiselect > ul > .wide > div > ul > li:nth-child(4) > label > .multiselectItem-name',
      //   { text: 'New Value' }
      // );
      cy.contains(
        '#metadataForm > div:nth-child(3) > .form-group.multiselect > ul > .wide > div > ul > li:nth-child(4) > label > .multiselectItem-name',
        'New Value'
      ).should('exist');
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
      const expectedMultiselect = [
        'De asunto',
        'Medidas Provisionales',
        'New Value',
        'Excepciones Preliminares',
        'Fondo',
      ];
      cy.get(
        '#metadataForm > div:nth-child(3) > .form-group.multiselect > ul > li.wide > div > ul > li > label > .multiselectItem-name'
      ).each((element, index) => {
        const content = element.text();
        cy.wrap(content).should('eq', expectedMultiselect[index]);
      });
    });

    it('should add a thesauti value on a single select field and select it', () => {
      // await expect(page).toClick(
      //   '#metadataForm > div:nth-child(3) > .form-group.select > ul > .wide > div > div > button > span',
      //   { text: 'add value' }
      // );
      cy.contains(
        '#metadataForm > div:nth-child(3) > .form-group.select > ul > .wide > div > div > button > span',
        'add value'
      ).click();
      // await expect(page).toFill('input[name=value]#newThesauriValue', 'New Value');
      cy.get('input[name=value]#newThesauriValue').click();
      cy.get('input[name=value]#newThesauriValue').type('New Value', {
        force: true,
      });
      // await expect(page).toClick('.confirm-button', { text: 'Save' });
      cy.contains('.confirm-button', 'Save').click();
    });
  });
});
