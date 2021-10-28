/*global page*/

import { ElementHandle } from 'puppeteer';
import { ensure } from 'shared/tsUtils';
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';
import { uploadSupportingFileToEntity } from '../helpers/createEntity';
import { goToRestrictedEntities } from '../helpers/publishedFilter';
import { refreshIndex } from '../helpers/elastichelpers';
import { getContentBySelector } from '../helpers/selectorUtils';

const { toMatchImageSnapshot } = require('jest-image-snapshot');

expect.extend({ toMatchImageSnapshot });

async function assertScreenshot(selector: string) {
  const attachmentsList = ensure<ElementHandle>(await page.$(selector));
  const chartScreenshot = await attachmentsList.screenshot();
  expect(chartScreenshot).toMatchImageSnapshot({
    failureThreshold: 0.03,
    failureThresholdType: 'percent',
    allowSizeMismatch: true,
  });
}

async function addSupportingFile(filePath: string) {
  await expect(page).toClick('button', { text: 'Add supporting file' });
  await uploadSupportingFileToEntity(filePath);
}

const createEntityWithSupportingFiles = async (
  title: string,
  files: string[]
  //webAttachment: { name: string; url: string }
) => {
  await expect(page).toClick('button', { text: 'Create entity' });
  await expect(page).toFill('textarea[name="library.sidepanel.metadata.title"]', title);

  await addSupportingFile(files[0]);
  await addSupportingFile(files[1]);

  //TODO: test attachment from web
  /*
  await expect(page).toClick('button', { text: 'Add supporting file' });
  await expect(page).toClick('.tab-link', { text: 'Add from web' });
  await expect(page).toFill('.web-attachment-url', webAttachment.url);
  await expect(page).toFill('.web-attachment-name', webAttachment.name);
  await expect(page).toClick('button', { text: 'Add resource' });
  */

  await expect(page).toClick('button', { text: 'Save' });
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
    await expect(page).toClick('button', { text: 'Save' });
  });

  it('Should create a new entity with attachements', async () => {
    const entityTitle = 'Entity with supporting files';
    const filesAttachments = [
      `${__dirname}/test_files/valid.pdf`,
      `${__dirname}/test_files/batman.jpg`,
    ];
    //const webAttachments = { name: 'Name of the image', url: 'https://image.source' };
    await goToRestrictedEntities();
    await createEntityWithSupportingFiles(entityTitle, filesAttachments);
    await refreshIndex();
    await expect(page).toClick('.item-document', {
      text: entityTitle,
    });
    const fileList = await getContentBySelector('.attachment-name span:not(.attachment-size)');
    expect(fileList).toEqual(['batman.jpg', 'valid.pdf']);
    await assertScreenshot('.attachments-list-parent');
  });

  afterAll(async () => {
    await logout();
  });
});
