/*global page*/

import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';
import { uploadSupportingFileToEntity } from '../helpers/createEntity';
import { goToRestrictedEntities } from '../helpers/publishedFilter';
import { refreshIndex } from '../helpers/elastichelpers';
import { getContentBySelector } from '../helpers/selectorUtils';

async function addSupportingFile(filePath: string) {
  await expect(page).toClick('button', { text: 'Add supporting file' });
  await uploadSupportingFileToEntity(filePath);
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

  await expect(page).toClick('button', { text: 'Add supporting file' });
  await expect(page).toClick('.tab-link', { text: 'Add from web' });
  await expect(page).toFill('.web-attachment-url', webAttachment.url);
  await expect(page).toFill('.web-attachment-name', webAttachment.name);
  await expect(page).toClick('button', { text: 'Add resource' });

  await expect(page).toClick('button', { text: 'Save' });
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
    `${__dirname}/test_files/valid.pdf`,
    `${__dirname}/test_files/batman.jpg`,
  ];

  it('Should create new entity', async () => {
    await expect(page).toClick('button', { text: 'Create entity' });
    await expect(page).toFill('textarea[name="library.sidepanel.metadata.title"]', 'Test title');
    await expect(page).toMatchElement('button', { text: 'Save' });
    await expect(page).toClick('button', { text: 'Save' });
  });

  it('Should create a new entity with attachments', async () => {
    await goToRestrictedEntities();
    await createEntityWithSupportingFiles(entityTitle, filesAttachments, webAttachments);
    await refreshIndex();
    await expect(page).toClick('.item-document', {
      text: entityTitle,
    });
    const fileList = await getContentBySelector('.attachment-name span:not(.attachment-size)');
    expect(fileList).toEqual(['Resource from web', 'batman.jpg', 'valid.pdf']);
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
    await expect(page).toClick('button', { text: 'Save' });
    await refreshIndex();
    await expect(page).toClick('.item-document', {
      text: entityTitle,
    });
    const fileList = await getContentBySelector('.attachment-name span:not(.attachment-size)');
    expect(fileList).toEqual(['My PDF.pdf', 'Resource from web', 'batman.jpg']);
  });

  it('should delete the first attachment', async () => {
    await expect(page).toClick('.item-document', {
      text: entityTitle,
    });
    await expect(page).toClick('button', { text: 'Edit' });
    await expect(page).toClick('.delete-supporting-file');
    await expect(page).toClick('button', { text: 'Save' });
    await refreshIndex();
    await expect(page).toClick('.item-document', {
      text: entityTitle,
    });
    await page.waitForSelector('.attachment-name');
    const fileList = await getContentBySelector('.attachment-name span:not(.attachment-size)');
    expect(fileList).toEqual(['Resource from web', 'batman.jpg']);
  });

  afterAll(async () => {
    await logout();
  });
});
