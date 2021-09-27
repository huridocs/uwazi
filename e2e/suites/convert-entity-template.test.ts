/*global page*/

import { ElementHandle } from 'puppeteer';
import { createEntity } from '../helpers/createEntity';
import { createTemplate } from '../helpers/createTemplate';
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';

const setupPreFlights = async (): Promise<void> => {
  await insertFixtures();
  await proxyMock();
  await adminLogin();
};

const setupTest = async () => {
  await createTemplate('Without image');
  await createTemplate('With image');
  await createEntity('Without image', {
    pdf: `${__dirname}/test_files/valid.pdf`,
    supportingFile: `${__dirname}/test_files/batman.jpg`,
  });
};

describe('Convert entity template', () => {
  beforeAll(async () => {
    await setupPreFlights();
    await setupTest();
    await disableTransitions();
  });

  it('Should select image for image property from supporting files', async () => {
    await expect(page).toClick('a[type="button"]');

    await expect(page).toClick('.metadata-sidepanel button.edit-metadata', {
      text: 'Edit',
    });
    await expect(page).toMatchElement('select.form-control > option');
    const options = await page.$$('select.form-control > option');

    const optionsValues = await options.map(async (optionElement: ElementHandle<Element>) => {
      const value = await optionElement.evaluate(optionEl => ({
        text: optionEl.textContent,
        value: optionEl.getAttribute('value') as string,
      }));
      return value;
    });

    const optionValues: any[] = await Promise.all(optionsValues);
    const { value } = optionValues.find(option => option.text === 'With image');

    await expect(page).toMatchElement('select.form-control');
    await page.select('select.form-control', value);
    await expect(page).toClick('span', { text: 'Select supporting file' });
    await expect(page).toMatchElement('div.media-grid-card-header > h5', { text: 'batman.jpg' });
  });

  afterAll(async () => {
    await logout();
  });
});
