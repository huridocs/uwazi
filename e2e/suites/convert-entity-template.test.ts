/*global page*/

import { ElementHandle } from 'puppeteer';
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import { host } from '../config';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';

const setupPreFlights = async (): Promise<void> => {
  await insertFixtures();
  await proxyMock();
  await adminLogin();
  await disableTransitions();
};

const createTemplate = async (name: string) => {
  await page.goto(`${host}/en/settings/account`);
  await expect(page).toClick('span', { text: 'Templates' });
  await expect(page).toClick('span', { text: 'Add template' });
  await expect(page).toFill('input[name="template.data.name"]', name);
  if (name === 'With image') {
    const imageElement = await page.$$('ul.property-options-list > .list-group-item');
    const button = await imageElement[11].$$('button');
    await button[0].click();
  }
  await expect(page).toClick('button[type="submit"]');
  await expect(page).toClick('span', { text: 'Saved successfully.' });
};

const createEntity = async (templateName: string) => {
  await page.goto(`${host}`);
  await expect(page).toClick('button', { text: 'Create entity' });
  await expect(page).toFill('textarea[name="library.sidepanel.metadata.title"]', templateName);
  let options: ElementHandle<Element>[] = [];
  await page.$$('select.form-control > option').then(selects => {
    options = selects;
  });

  // @ts-ignore
  options.forEach(async (option: ElementHandle): void => {
    const value = await option.evaluate(optionEl => ({
      text: optionEl.textContent,
      value: optionEl.getAttribute('value') as string,
    }));
    if (value.text === templateName) {
      await page.select('select.form-control', value.value);
    }
  });
  await expect(page).toMatchElement('button[form="metadataForm"]', { text: 'Save' });
  await expect(page).toClick('button[form="metadataForm"]', { text: 'Save' });
  await expect(page).toClick('span', { text: 'Entity created' });
};

const uploadPDFToEntity = async (entityName: string) => {
  await page.goto(`${host}`);
  await expect(page).toClick('span', { text: 'Restricted' });
  await expect(page).toClick('div.item-name > span', { text: entityName });
  await expect(page).toUploadFile('#upload-button-input', `${__dirname}/test_files/valid.pdf`);
};

const UploadSupportingFileToEntity = async (entityName: string): Promise<void> => {
  await page.goto(`${host}`);
  await expect(page).toClick('span', { text: 'Restricted' });
  await expect(page).toClick('div.item-name > span', { text: entityName });
  await expect(page).toClick('button[type="button"].upload-button');
  const [fileChooser] = await Promise.all([
    page.waitForFileChooser(),
    page.click('div.attachments-modal__dropzone > button'),
  ]);
  await fileChooser.accept([`${__dirname}/test_files/batman.jpg`]);
};

const convertEntityTemplate = async (entityName: string, targetTemplate: string): Promise<void> => {
  await page.goto(`${host}`);
  await expect(page).toClick('span', { text: 'Restricted' });
  await expect(page).toClick('div.item-name > span', { text: entityName });
  await expect(page).toClick('div.sidepanel-footer > button[type="button"].edit-metadata');
};

const setupTest = async () => {
  await createTemplate('Without image');
  await createTemplate('With image');
  await createEntity('Without image');
  await uploadPDFToEntity('Without image');
  await UploadSupportingFileToEntity('Without image');
};

describe('Convert entity template', () => {
  beforeAll(async () => {
    await setupPreFlights();

    await convertEntityTemplate('Without image', 'With image');
  });

  it('Should create new entity', async () => {
    await setupTest();
    await expect(page).toClick('a[(type = "button")].btn');
  });

  afterAll(async () => {
    await logout();
  });
});
