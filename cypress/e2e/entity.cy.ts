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
      cy.visit(`${host}/library`);
      goToRestrictedEntities();
      cy.contains('.item-name span', 'Entity with media files').click();
      cy.get('.metadata-name-descripci_n > dd > div > p').should(
        'contain.text',
        'A description of the report'
      );

      cy.get('.metadata-name-fotograf_a > dd > img')
        .should('have.prop', 'src')
        .and('match', /\w+\/api\/files\/\w+\.jpg$/);

      cy.get('.metadata-name-video > dd > div > div > div > div:nth-child(1) > div > video')
        .should('have.prop', 'src')
        .and('match', /^blob:http:\/\/localhost:3000\/[\w-]+$/);
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
        goToRestrictedEntities();
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
        clickOnCreateEntity();
        cy.get('[name="library.sidepanel.metadata.title"]').click();
        cy.get('[name="library.sidepanel.metadata.title"]').type(entityTitle, {
          force: true,
        });
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
        cy.contains('button', 'Add file').click();
        cy.contains('.tab-link', 'Add from web').click();
        cy.get('.web-attachment-url').click();
        cy.get('.web-attachment-url').type(webAttachments.url, { force: true });
        cy.get('.web-attachment-name').click();
        cy.get('.web-attachment-name').type(webAttachments.name, { force: true });
        cy.contains('button', 'Add from URL').click();

        cy.contains('button', 'Save').click();
        cy.contains('.item-document', entityTitle).click();
        const expectedNewFiles = ['batman.jpg', 'Resource from web', 'valid.pdf'];
        cy.get('.attachment-name span:not(.attachment-size)').each((element, index) => {
          const content = element.text();
          cy.wrap(content).should('eq', expectedNewFiles[index]);
        });
      });

      it('should rename a supporting file', () => {
        cy.contains('.item-document', entityTitle).click();
        clickOnEditEntity();
        cy.get('input[name="library.sidepanel.metadata.attachments.2.originalname"]').clear();
        cy.get('input[name="library.sidepanel.metadata.attachments.2.originalname"]').type(
          'My PDF.pdf',
          { force: true }
        );
        cy.contains('button', 'Save').click();
        cy.contains('.item-document', entityTitle).click();
        const expectedRenamedFiles = ['batman.jpg', 'My PDF.pdf', 'Resource from web'];
        cy.get('.attachment-name span:not(.attachment-size)').each((element, index) => {
          const content = element.text();
          console.log(content);
          cy.wrap(content).should('eq', expectedRenamedFiles[index]);
        });
      });

      it('should delete the first supporting file', () => {
        cy.contains('.item-document', entityTitle).click();
        clickOnEditEntity();
        cy.get('.delete-supporting-file').eq(0).click();
        cy.contains('button', 'Save').click();
        cy.contains('.item-document', entityTitle).click();
        const expectedSupportingFiles = ['My PDF.pdf', 'Resource from web'];
        cy.get('.attachment-name span:not(.attachment-size)').each((element, index) => {
          const content = element.text();
          cy.wrap(content).should('eq', expectedSupportingFiles[index]);
        });
      });
    });

    describe('Entity with main documents', () => {
      it('Should create a new entity with a main documents', () => {
        goToRestrictedEntities();
        clickOnCreateEntity();
        cy.get('textarea[name="library.sidepanel.metadata.title"]').click();
        cy.get('textarea[name="library.sidepanel.metadata.title"]').type(
          'Entity with main documents',
          { force: true }
        );
        cy.get('input[name="library.sidepanel.metadata.metadata.resumen"]').click();
        cy.get('input[name="library.sidepanel.metadata.metadata.resumen"]').type(
          'An entity with main documents',
          { force: true }
        );
        cy.get('.document-list-parent > input')
          .first()
          .selectFile('./cypress/test_files/valid.pdf', {
            force: true,
          });
        cy.contains('button', 'Save').click();
      });

      it('should edit the entity and the documents', () => {
        cy.contains('.item-document', 'Entity with main documents').click();
        cy.contains('.metadata-type-text', 'An entity with main documents').click();
        clickOnEditEntity();
        cy.get('input[name="library.sidepanel.metadata.documents.0.originalname"]').click().clear();
        cy.get('input[name="library.sidepanel.metadata.documents.0.originalname"]').type(
          'Renamed file.pdf',
          { force: true }
        );
        cy.get('.document-list-parent > input')
          .first()
          .selectFile('./cypress/test_files/invalid.pdf', {
            force: true,
          });
        cy.contains('button', 'Save').click();
        cy.contains('.item-document', 'Entity with main documents').click();
        cy.contains('.file-originalname', 'Renamed file.pdf').should('exist');
        cy.contains('.file-originalname', 'invalid.pdf').should('exist');
      });

      it('should delete the invalid document', () => {
        clickOnEditEntity();
        cy.get('.attachments-list > .attachment:nth-child(2) > button').click();
        cy.contains('button', 'Save').click();
        cy.contains('.item-document', 'Entity with main documents').click();
        cy.contains('.file-originalname', 'Renamed file.pdf').should('exist');
        cy.contains('.file-originalname', 'invalid.pdf').should('not.exist');
      });
    });
  });

  describe('Languages', () => {
    it('should change the entity in Spanish', () => {
      changeLanguage('Español');
      cy.contains('.item-document', 'Test title').click();
      clickOnEditEntity('Editar');
      cy.get('textarea[name="library.sidepanel.metadata.title"]').click();
      cy.get('textarea[name="library.sidepanel.metadata.title"]').type('Título de prueba', {
        force: true,
      });
      cy.get('input[name="library.sidepanel.metadata.metadata.resumen"]').click();
      cy.get('input[name="library.sidepanel.metadata.metadata.resumen"]').type(
        'Resumen en español',
        { force: true }
      );
      cy.contains('.multiselectItem-name', 'Argentina').click();
      cy.contains('button', 'Guardar').click();
    });

    it('should check the values for the entity in Spanish', () => {
      cy.contains('.item-document', 'Título de prueba').click();
      cy.contains('h1.item-name', 'Título de prueba').should('exist');
      cy.contains('.metadata-type-text > dd', 'Resumen en español').should('exist');
      cy.contains('.multiline > .item-value > a', 'Argentina').should('exist');
    });

    it('should edit the text field in English', () => {
      changeLanguage('English');
      cy.contains('.item-document', 'Test title').click();
      clickOnEditEntity();
      cy.get('input[name="library.sidepanel.metadata.metadata.resumen"]').click();
      cy.get('input[name="library.sidepanel.metadata.metadata.resumen"]').type('Brief in English', {
        force: true,
      });
      cy.contains('button', 'Save').click();
      cy.contains('.item-document', 'Test title').click();
      cy.contains('.metadata-type-text > dd', 'Brief in English').should('exist');
      cy.contains('.multiline > .item-value > a', 'Argentina').should('exist');
    });

    it('should not affect the text field in Spanish', () => {
      changeLanguage('Español');
      cy.contains('.item-document', 'Título de prueba').click();
      cy.contains('.metadata-type-text > dd', 'Resumen en español').should('exist');
    });
  });

  describe('new thesauri values shortcut', () => {
    before(() => {
      changeLanguage('English');
      cy.get('li[title=Published]').click();
      cy.contains('span', 'Ordenes de la corte').should('exist');
      cy.contains('span', 'Ordenes de la corte').click();
      cy.contains(
        '.item-document',
        'Artavia Murillo y otros. Resolución de la Corte IDH de 31 de marzo de 2014'
      ).click();
      clickOnEditEntity();
    });

    it('should add a thesauri value on a multiselect field and select it', () => {
      cy.contains(
        '#metadataForm > div:nth-child(3) > .form-group.multiselect > ul > .wide > div > div > button > span',
        'add value'
      ).click();
      cy.get('input[name=value]#newThesauriValue').click();
      cy.get('input[name=value]#newThesauriValue').type('New Value', {
        force: true,
      });
      cy.contains('button.confirm-button', 'Save').click();
      cy.contains(
        '#metadataForm > div:nth-child(3) > .form-group.multiselect > ul > .wide > div > ul > li:nth-child(4) > label > .multiselectItem-name',
        'New Value'
      ).should('exist');
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
      cy.contains(
        '#metadataForm > div:nth-child(3) > .form-group.select > ul > .wide > div > div > button > span',
        'add value'
      ).click();
      cy.get('input[name=value]#newThesauriValue').click();
      cy.get('input[name=value]#newThesauriValue').type('New Value', {
        force: true,
      });
      cy.contains('.confirm-button', 'Save').click();
    });
  });
});
