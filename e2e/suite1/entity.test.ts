/* eslint-disable max-lines */
/*global page*/

import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';
import { uploadFileInMetadataField, scrollTo } from '../helpers/formActions';
import { uploadSupportingFileToEntity } from '../helpers/createEntity';
import { goToRestrictedEntities } from '../helpers/publishedFilter';
import { refreshIndex } from '../helpers/elastichelpers';
import { checkStringValuesInSelectors, getContentBySelector } from '../helpers/selectorUtils';
import { changeLanguage } from '../helpers/changeLanguage';
import { host } from '../config';

const entityTitle = 'Entity with supporting files';
const webAttachments = {
  name: 'Resource from web',
  url: 'https://fonts.googleapis.com/icon?family=Material+Icons',
};
const filesAttachments = [
  `${__dirname}/../test_files/valid.pdf`,
  `${__dirname}/../test_files/batman.jpg`,
];
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

const addSupportingFile = async (filePath: string) => {
  await expect(page).toClick('button', { text: 'Add file' });
  await uploadSupportingFileToEntity(filePath);
};

const saveEntityAndClosePanel = async (text?: string) => {
  await expect(page).toClick('button', { text: text || 'Save' });
  await expect(page).toClick('.alert.alert-success');
  await refreshIndex();
  await expect(page).toClick('.is-active button.closeSidepanel');
};

const createEntityWithSupportingFiles = async (
  title: string,
  files: string[],
  webAttachment: { name: string; url: string }
) => {
  await expect(page).toClick('button', { text: 'Create entity' });
  await expect(page).toFill('textarea[name="library.sidepanel.metadata.title"]', title);

  await addSupportingFile(files[0]);
  await addSupportingFile(files[1]);

  await expect(page).toClick('button', { text: 'Add file' });
  await expect(page).toClick('.tab-link', { text: 'Add from web' });
  await expect(page).toFill('.web-attachment-url', webAttachment.url);
  await expect(page).toFill('.web-attachment-name', webAttachment.name);
  await expect(page).toClick('button', { text: 'Add from URL' });

  await saveEntityAndClosePanel();
};

describe('Entities', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  it('Should create new entity', async () => {
    await expect(page).toClick('button', { text: 'Create entity' });
    await expect(page).toFill('textarea[name="library.sidepanel.metadata.title"]', 'Test title');
    await expect(page).toMatchElement('button', { text: 'Save' });
    await saveEntityAndClosePanel();
  }, 4000);

  describe('Rich text fields', () => {
    it('should create an entity with HTML on a rich text field', async () => {
      await expect(page).toClick('button', { text: 'Create entity' });
      await expect(page).toSelect('select:first-of-type', 'Reporte');
      await expect(page).toFill(
        'textarea[name="library.sidepanel.metadata.title"]',
        'Entity with HTML'
      );
      await expect(page).toFill('#tabpanel-edit > textarea', textWithHtml);
      await expect(page).toClick('button', { text: 'Save' });
    });

    it('should check that the HTML is show as expected', async () => {
      await expect(page).toMatchElement('h1', { text: 'The title' });
      await expect(page).toMatchElement('a', { text: 'I am a link to an external site' });
      await expect(page).toMatchElement('.someClass > li:nth-child(1)', { text: 'List item 1' });
      await expect(page).toMatchElement('.someClass > li:nth-child(2)', { text: 'List item 2' });
    });

    it('should navigate to an entity via the rich text field link', async () => {
      await expect(page).toClick('a', { text: 'I am a link to the internal Ecuador entity' });
      await page.waitForNavigation();
      await disableTransitions();
      await expect(page).toMatchElement('.content-header-title > h1:nth-child(1)', {
        text: 'Ecuador',
      });
    });
  });

  describe('Entity with files in metadata fields', () => {
    it('should create and entity with and image in a metadata field', async () => {
      await goToRestrictedEntities();
      await expect(page).toClick('button', { text: 'Create entity' });
      await expect(page).toSelect('select', 'Reporte');
      await expect(page).toFill(
        'textarea[name="library.sidepanel.metadata.title"]',
        'Entity with media files'
      );
      await expect(page).toFill('#tabpanel-edit > textarea', 'A description of the report');
      await scrollTo(
        '#metadataForm > div:nth-child(3) > div:nth-child(4) > ul > li.wide > div > div > div > button'
      );
      await expect(page).toClick(
        '#metadataForm > div:nth-child(3) > div:nth-child(4) > ul > li.wide > div > div > div > button'
      );
      await uploadFileInMetadataField(
        `${__dirname}/../test_files/batman.jpg`,
        'input[aria-label=fileInput]'
      );
      await saveEntityAndClosePanel();
    });

    it('should edit the entity to add a video on a metadata field', async () => {
      await expect(page).toClick('.item-document', {
        text: 'Entity with media files',
      });
      await expect(page).toClick('button', { text: 'Edit' });
      await expect(page).toClick(
        '#metadataForm > div:nth-child(3) > div.form-group.media > ul > li.wide > div > div > div > button'
      );
      await uploadFileInMetadataField(
        `${__dirname}/../test_files/short-video.webm`,
        'input[aria-label=fileInput]'
      );
      await saveEntityAndClosePanel();
    });

    it('should check the entity', async () => {
      await page.goto(`${host}/library`);
      await goToRestrictedEntities();
      await expect(page).toClick('.item-name span', {
        text: 'Entity with media files',
      });
      await page.waitForSelector('#tabpanel-metadata video');
      await expect(page).toMatchElement('.metadata-name-descripci_n > dd > div > p', {
        text: 'A description of the report',
      });

      const [fotografiaFieldSource] = await page.$$eval(
        '.metadata-name-fotograf_a > dd > img',
        el => el.map(x => x.getAttribute('src'))
      );
      const [videoFieldSource] = await page.$$eval(
        '.metadata-name-video > dd > div > div > div > div:nth-child(1) > div > video',
        el => el.map(x => x.getAttribute('src'))
      );

      await checkStringValuesInSelectors([
        { selector: fotografiaFieldSource, expected: /^\/api\/files\/\w+\.jpg$/ },
        { selector: videoFieldSource, expected: /^blob:http:\/\/localhost:3000\/[\w-]+$/ },
      ]);

      const fileList = await getContentBySelector('.attachment-name span:not(.attachment-size)');
      expect(fileList).toEqual(['batman.jpg', 'short-video.webm']);
    });
  });

  describe('supporting files and main documents', () => {
    describe('Entity with supporting files', () => {
      it('Should create a new entity with supporting files', async () => {
        await goToRestrictedEntities();
        await createEntityWithSupportingFiles(entityTitle, filesAttachments, webAttachments);
        await expect(page).toClick('.item-document', {
          text: entityTitle,
        });
        const fileList = await getContentBySelector('.attachment-name span:not(.attachment-size)');
        expect(fileList).toEqual(['batman.jpg', 'Resource from web', 'valid.pdf']);
      });

      it('should rename a supporting file', async () => {
        await expect(page).toClick('.item-document', {
          text: entityTitle,
        });
        await expect(page).toClick('button', { text: 'Edit' });
        await expect(page).toFill(
          'input[name="library.sidepanel.metadata.attachments.2.originalname"]',
          'My PDF.pdf'
        );
        await saveEntityAndClosePanel();
        await expect(page).toClick('.item-document', {
          text: entityTitle,
        });
        const fileList = await getContentBySelector('.attachment-name span:not(.attachment-size)');
        expect(fileList).toEqual(['batman.jpg', 'My PDF.pdf', 'Resource from web']);
      });

      it('should delete the first supporting file', async () => {
        await expect(page).toClick('.item-document', {
          text: entityTitle,
        });
        await expect(page).toClick('button', { text: 'Edit' });
        await expect(page).toClick('.delete-supporting-file');
        await saveEntityAndClosePanel();
        await expect(page).toClick('.item-document', {
          text: entityTitle,
        });
        await page.waitForSelector('.attachment-name');
        const fileList = await getContentBySelector('.attachment-name span:not(.attachment-size)');
        expect(fileList).toEqual(['My PDF.pdf', 'Resource from web']);
      });
    });

    describe('Entity with main documents', () => {
      it('Should create a new entity with a main documents', async () => {
        await goToRestrictedEntities();

        await expect(page).toClick('button', { text: 'Create entity' });
        await expect(page).toFill(
          'textarea[name="library.sidepanel.metadata.title"]',
          'Entity with main documents'
        );
        await expect(page).toFill(
          'input[name="library.sidepanel.metadata.metadata.resumen"]',
          'An entity with main documents'
        );

        await expect(page).toUploadFile(
          '.document-list-parent > input',
          `${__dirname}/../test_files/valid.pdf`
        );

        await saveEntityAndClosePanel();
      });

      it('should edit the entity and the documents', async () => {
        await expect(page).toClick('.item-document', {
          text: 'Entity with main documents',
        });

        await expect(page).toMatchElement('.metadata-type-text', {
          text: 'An entity with main documents',
        });

        await expect(page).toClick('button', { text: 'Edit' });

        await expect(page).toFill(
          'input[name="library.sidepanel.metadata.documents.0.originalname"]',
          'Renamed file.pdf'
        );

        await expect(page).toUploadFile(
          '.document-list-parent > input',
          `${__dirname}/../test_files/invalid.pdf`
        );

        await saveEntityAndClosePanel();

        await expect(page).toClick('.item-document', {
          text: 'Entity with main documents',
        });

        await page.waitForSelector('.file-originalname');

        await expect(page).toMatchElement('.file-originalname', { text: 'Renamed file.pdf' });
        await expect(page).toMatchElement('.file-originalname', { text: 'invalid.pdf' });
      });

      it('should delete the invalid document', async () => {
        await expect(page).toClick('button', { text: 'Edit' });

        await expect(page).toClick('.attachments-list > .attachment:nth-child(2) > button');

        await saveEntityAndClosePanel();

        await expect(page).toClick('.item-document', {
          text: 'Entity with main documents',
        });

        await expect(page).toMatchElement('.file-originalname', { text: 'Renamed file.pdf' });
        await expect(page).not.toMatchElement('.file-originalname', { text: 'invalid.pdf' });
      });
    });
  });

  describe('Languages', () => {
    it('should change the entity in Spanish', async () => {
      await changeLanguage('Español');

      await expect(page).toClick('.item-document', {
        text: 'Test title',
      });

      await expect(page).toClick('button', { text: 'Editar' });

      await expect(page).toFill(
        'textarea[name="library.sidepanel.metadata.title"]',
        'Título de prueba'
      );

      await expect(page).toFill(
        'input[name="library.sidepanel.metadata.metadata.resumen"]',
        'Resumen en español'
      );

      await expect(page).toClick('.multiselectItem-name', { text: 'Argentina' });

      await saveEntityAndClosePanel('Guardar');
    }, 4000);

    it('should check the values for the entity in Spanish', async () => {
      await expect(page).toClick('.item-document', {
        text: 'Título de prueba',
      });

      await expect(page).toMatchElement('h1.item-name', {
        text: 'Título de prueba',
      });

      await expect(page).toMatchElement('.metadata-type-text > dd', {
        text: 'Resumen en español',
      });

      await expect(page).toMatchElement('.multiline > .item-value > a', {
        text: 'Argentina',
      });
    }, 4000);

    it('should edit the text field in English', async () => {
      await changeLanguage('English');

      await expect(page).toClick('.item-document', {
        text: 'Test title',
      });

      await expect(page).toClick('button', { text: 'Edit' });

      await expect(page).toFill(
        'input[name="library.sidepanel.metadata.metadata.resumen"]',
        'Brief in English'
      );

      await saveEntityAndClosePanel();

      await expect(page).toClick('.item-document', {
        text: 'Test title',
      });

      await expect(page).toMatchElement('.metadata-type-text > dd', {
        text: 'Brief in English',
      });
      await expect(page).toMatchElement('.multiline > .item-value > a', {
        text: 'Argentina',
      });
    }, 4000);

    it('should not affect the text field in Spanish', async () => {
      await changeLanguage('Español');

      await expect(page).toClick('.item-document', {
        text: 'Título de prueba',
      });

      await expect(page).toMatchElement('.metadata-type-text > dd', {
        text: 'Resumen en español',
      });
    }, 4000);
  });

  describe('new thesauri values shortcut', () => {
    beforeAll(async () => {
      await changeLanguage('English');
      await expect(page).toClick('li[title=Published]');
      await expect(page).toMatchElement('span', { text: 'Ordenes de la corte' });
      await expect(page).toClick('span', { text: 'Ordenes de la corte' });
      await expect(page).toClick('.item-document', {
        text: 'Artavia Murillo y otros. Resolución de la Corte IDH de 31 de marzo de 2014',
      });
      await expect(page).toClick('button.edit-metadata', { text: 'Edit' });
    });

    it('should add a thesauri value on a multiselect field and select it', async () => {
      await expect(page).toClick(
        '#metadataForm > div:nth-child(3) > .form-group.multiselect > ul > .wide > div > div > button > span',
        { text: 'add value' }
      );
      await expect(page).toFill('input[name=value]#newThesauriValue', 'New Value');
      await expect(page).toClick('.confirm-button', { text: 'Save' });
      await expect(page).toMatchElement(
        '#metadataForm > div:nth-child(3) > .form-group.multiselect > ul > .wide > div > ul > li:nth-child(4) > label > .multiselectItem-name',
        { text: 'New Value' }
      );
      const selectedItems = await getContentBySelector(
        '#metadataForm > div:nth-child(3) > .form-group.multiselect > ul > li.wide > div > ul > li > label > .multiselectItem-name'
      );
      expect(selectedItems).toEqual([
        'De asunto',
        'Medidas Provisionales',
        'New Value',
        'Excepciones Preliminares',
        'Fondo',
      ]);
    });

    it('should add a thesauti value on a single select field and select it', async () => {
      await expect(page).toClick(
        '#metadataForm > div:nth-child(3) > .form-group.select > ul > .wide > div > div > button > span',
        { text: 'add value' }
      );
      await expect(page).toFill('input[name=value]#newThesauriValue', 'New Value');
      await expect(page).toClick('.confirm-button', { text: 'Save' });
    });
  });

  afterAll(async () => {
    await logout();
  });
});
