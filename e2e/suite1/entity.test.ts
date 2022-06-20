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

async function addSupportingFile(filePath: string) {
  await expect(page).toClick('button', { text: 'Add file' });
  await uploadSupportingFileToEntity(filePath);
}

async function saveEntityAndClosePanel() {
  await expect(page).toClick('button', { text: 'Save' });
  await expect(page).toClick('.alert.alert-success');
  await refreshIndex();
  await expect(page).toClick('.is-active button.closeSidepanel');
}

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

  const entityTitle = 'Entity with supporting files';
  const webAttachments = {
    name: 'Resource from web',
    url: 'https://fonts.googleapis.com/icon?family=Material+Icons',
  };
  const filesAttachments = [
    `${__dirname}/../test_files/valid.pdf`,
    `${__dirname}/../test_files/batman.jpg`,
  ];

  it('Should create new entity', async () => {
    await expect(page).toClick('button', { text: 'Create entity' });
    await expect(page).toFill('textarea[name="library.sidepanel.metadata.title"]', 'Test title');
    await expect(page).toMatchElement('button', { text: 'Save' });
    await saveEntityAndClosePanel();
  });

  it('Should create a new entity with attachments', async () => {
    await goToRestrictedEntities();
    await createEntityWithSupportingFiles(entityTitle, filesAttachments, webAttachments);
    await expect(page).toClick('.item-document', {
      text: entityTitle,
    });
    const fileList = await getContentBySelector('.attachment-name span:not(.attachment-size)');
    expect(fileList).toEqual(['batman.jpg', 'Resource from web', 'valid.pdf']);
  });

  it('should rename an attachment', async () => {
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

  it('should delete the first attachment', async () => {
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

  describe('entity with files in metadata fields', () => {
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
        `${__dirname}/../test_files/short-video.mp4`,
        'input[aria-label=fileInput]'
      );
      await saveEntityAndClosePanel();
    });

    it('should check the entity', async () => {
      await expect(page).toClick('.item-name span', {
        text: 'Entity with media files',
      });
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
        { selector: videoFieldSource, expected: /^\/api\/files\/\w+\.mp4$/ },
      ]);

      const fileList = await getContentBySelector('.attachment-name span:not(.attachment-size)');
      expect(fileList).toEqual(['batman.jpg', 'short-video.mp4']);
    });
  });

  afterAll(async () => {
    await logout();
  });
});
