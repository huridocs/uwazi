/*global page*/

import { ElementHandle } from 'puppeteer';
import { createEntity } from 'e2e/helpers/createEntity';
import { createTemplate } from 'e2e/helpers/createTemplate';
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';

const setupPreFlights = async (): Promise<void> => {
  await insertFixtures();
  await proxyMock();
  await adminLogin();
  await disableTransitions();
};

const setupTest = async () => {
  await createTemplate('Without image');
  await createTemplate('With image');
  await createEntity('Without image', { pdf: 'valid.pdf', supportingFile: 'batman.jpg' });
};

describe('Convert entity template', () => {
  beforeAll(async () => {
    await setupPreFlights();
  });

  it('Should select image for image property from supporting files', async () => {
    await setupTest();
    await expect(page).toClick('a[type="button"]');
    await page.reload();
    await expect(page).toClick('button.edit-metadata');
    await page.waitFor(1000);
    const options = await page.$$('select.form-control > option');

    const optionsValues = await options.map(async (optionElement: ElementHandle<Element>) => {
      console.log('option');
      const value = await optionElement.evaluate(optionEl => ({
        text: optionEl.textContent,
        value: optionEl.getAttribute('value') as string,
      }));
      return value;
    });

    const optionValues: any[] = await Promise.all(optionsValues);
    const value = optionValues.find(option => option.text === 'With image').value;

    await page.select('select.form-control', value);
    await expect(page).toClick('span', { text: 'Select supporting file' });
    await page.waitFor(10000);
    await expect(page).toMatchElement('div.media-grid-card-header > h5', { text: 'batman.jpg' });
  });

  afterAll(async () => {
    await logout();
  });
});
