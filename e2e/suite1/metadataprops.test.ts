/* eslint-disable max-statements */

import { adminLogin, logout } from '../helpers/login';
import { host } from '../config';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import { clearInput, selectDate, scrollTo, waitForNavigation } from '../helpers/formActions';
import { goToRestrictedEntities } from '../helpers/publishedFilter';
import { mouseClick } from '../helpers/selectorUtils';

describe('Metadata Properties', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
  });

  it('should log in as admin then click the settings nav button.', async () => {
    await adminLogin();
    await waitForNavigation(expect(page).toClick('a', { text: 'Settings' }));
    expect(page.url()).toBe(`${host}/en/settings/account`);
  });

  it('should test number of available properties.', async () => {
    await expect(page).toClick('a', { text: 'Templates' });
    await expect(page).toClick('a', { text: 'Add template' });
    const propertyList = await page.$$('.property-options-list li');
    expect(propertyList.length).toBe(13);
  });

  describe('create template with all properties', () => {
    it('should create a template with all the properties', async () => {
      await expect(page).toClick('a', { text: 'Templates' });
      await expect(page).toClick('a', { text: 'Add template' });
      await expect(page).toFill('input[name="template.data.name"]', 'All props');

      const propertyAddButtons = await page.$$('.property-options-list li button');
      //intentionaly leaving the last fields out of the test: violated articles (nested), generated id.
      for (let propIndex = 0; propIndex < 11; propIndex += 1) {
        // eslint-disable-next-line no-await-in-loop
        await propertyAddButtons[propIndex].click();
      }

      const propertiesInMetadata = await page.$$('.metadataTemplate li');
      await expect(propertiesInMetadata[6]).toClick('button', { text: 'Edit' });
      await expect(propertiesInMetadata[6]).toSelect('select:first-of-type', 'Relacionado a');
      await expect(page).toClick('button', { text: 'Save' });
      await expect(page).toClick('div.alert-success');
    });

    it('should add another select of type multiselect', async () => {
      await expect(page).toClick('li.list-group-item:nth-child(3) > button:nth-child(1)');
      await expect(page).toClick(
        '.metadataTemplate-list > li:nth-child(15) > div:nth-child(1) > div:nth-child(2) > button',
        { text: 'Edit' }
      );
      await expect(page).toFill('#property-label', 'Multiselect');
      await expect(page).toSelect('#property-type', 'Multiple select');
      await expect(page).toClick('button', { text: 'Save' });
      await expect(page).toClick('div.alert-success');
    });

    it('should add multidate, date range and multidate range', async () => {
      for (let index = 0; index < 3; index += 1) {
        // eslint-disable-next-line no-await-in-loop
        await expect(page).toClick('li.list-group-item:nth-child(5) > button:nth-child(1)');
      }

      await expect(page).toClick(
        '.metadataTemplate-list > li:nth-child(16) > div:nth-child(1) > div:nth-child(2) > button',
        { text: 'Edit' }
      );
      await expect(page).toFill('#property-label', 'Multi Date');
      await expect(page).toSelect('#property-type', 'Multiple date');

      await expect(page).toClick(
        '.metadataTemplate-list > li:nth-child(17) > div:nth-child(1) > div:nth-child(2) > button',
        { text: 'Edit' }
      );
      await expect(page).toFill('#property-label', 'Date Range');
      await expect(page).toSelect('#property-type', 'Single date range');

      await expect(page).toClick(
        '.metadataTemplate-list > li:nth-child(18) > div:nth-child(1) > div:nth-child(2) > button',
        { text: 'Edit' }
      );

      await expect(page).toFill('#property-label', 'Multi Date Range');
      await expect(page).toSelect('#property-type', 'Multiple date range');

      await expect(page).toClick('button', { text: 'Save' });
      await expect(page).toClick('div.alert-success');
    });

    it('should not allow duplicated properties', async () => {
      await expect(page).toClick('.property-options-list li:first-child button');
      await expect(page).toClick('button', { text: 'Save' });
      await expect(page).toClick('.alert.alert-danger');
    });
  });

  it('should create an entity filling all the props.', async () => {
    await goToRestrictedEntities();
    await expect(page).toClick('button', { text: 'Create entity' });
    await expect(page).toFill(
      'textarea[name="library.sidepanel.metadata.title"]',
      'Entity with all props'
    );
    await expect(page).toSelect('select:first-of-type', 'All props');

    await expect(page).toFill('.form-group.text input', 'demo text');
    await expect(page).toFill('.form-group.numeric input', '42');
    await expect(page).toSelect('.form-group.select select', 'Activo');
    await scrollTo('.form-group.multiselect li.multiselectItem');
    await expect(page).toClick('.form-group.multiselect li.multiselectItem', {
      text: 'Activo',
    });
    await expect(page).toClick('.form-group.relationship li.multiselectItem', {
      text: '19 Comerciantes',
    });

    await mouseClick('.leaflet-container', 200, 100);
    const marker = await page.$$('.leaflet-marker-icon');
    expect(marker.length).toBe(1);

    await scrollTo('.form-group.date');
    await selectDate('.form-group.date input', '08/09/1966');
    await selectDate('.form-group.daterange div.DatePicker__From input', '23/11/1963');
    await selectDate('.form-group.daterange div.DatePicker__To input', '12/09/1964');
    await expect(page).toClick('.form-group.multidate button.btn.add');
    await selectDate('.form-group.multidate .multidate-item:first-of-type input', '23/11/1963');
    await selectDate('.form-group.multidate .multidate-item:nth-of-type(2) input', '12/09/1964');
    await expect(page).toClick('.form-group.multidaterange button.btn.add');
    await expect(page).toFill('.form-group.link #label', 'Huridocs');
    await scrollTo('.form-group.link #url');
    await expect(page).toFill('.form-group.link #url', 'https://www.huridocs.org/');
    await selectDate(
      '.form-group.multidaterange .multidate-item:first-of-type div.DatePicker__From input',
      '23/11/1963'
    );
    await selectDate(
      '.form-group.multidaterange .multidate-item:first-of-type div.DatePicker__To input',
      '12/09/1964'
    );
    await selectDate(
      '.form-group.multidaterange .multidate-item:nth-of-type(2) div.DatePicker__From input',
      '23/11/1963'
    );
    await selectDate(
      '.form-group.multidaterange .multidate-item:nth-of-type(2) div.DatePicker__To input',
      '12/09/1964'
    );
    await expect(page).toFill('.form-group.markdown textarea', '***smile***');

    await expect(page).toClick('button', { text: 'Save' });
    await expect(page).toClick('div.alert-success');
  });

  it('should have all the values correctly saved.', async () => {
    await expect(page).toMatchElement('.metadata-type-text', { text: 'demo text' });
    await expect(page).toMatchElement('.metadata-type-numeric', { text: '42' });
    await expect(page).toMatchElement('.metadata-type-select', { text: 'Activo' });
    await expect(page).toMatchElement('.metadata-type-multiselect', { text: 'Activo' });
    await expect(page).toMatchElement('.metadata-type-relationship', { text: '19 Comerciantes' });
    await expect(page).toMatchElement('.metadata-type-date', { text: 'Sep 8, 1966' });
    await expect(page).toMatchElement('.metadata-type-daterange', {
      text: 'Date RangeNov 23, 1963 ~ Sep 12, 1964',
    });

    await expect(page).toMatchElement('.metadata-type-multidate', {
      text: 'Multi DateNov 23, 1963Sep 12, 1964',
    });
    await expect(page).toMatchElement('.metadata-type-multidaterange', {
      text: 'Multi Date RangeNov 23, 1963 ~ Sep 12, 1964 2',
    });
    await expect(page).toMatchElement('.metadata-type-markdown strong', { text: 'smile' });
    const linkMetaData = await page.$('.metadata-type-link a');
    const linkText = await (await linkMetaData?.getProperty('text'))?.jsonValue();
    const link = await (await linkMetaData?.getProperty('href'))?.jsonValue();
    expect(linkText).toBe('Huridocs');
    expect(link).toBe('https://www.huridocs.org/');

    await scrollTo('.leaflet-container');
    const marker = await page.$$('.leaflet-marker-icon');
    expect(marker.length).toBe(1);
  });

  it('should be able to remove all the values from properties.', async () => {
    await expect(page).toClick('button.edit-metadata.btn svg');

    await clearInput('.form-group.text input');
    await clearInput('.form-group.numeric input');
    await expect(page).toSelect('.form-group.select select', 'Select...');
    await scrollTo('.form-group.multiselect li.multiselectItem');
    await expect(page).toClick('.form-group.multiselect li.multiselectItem', {
      text: 'Activo',
    });
    await expect(page).toClick('.form-group.relationship li.multiselectItem', {
      text: '19 Comerciantes',
    });

    await scrollTo('.form-group.date input');
    await expect(page).toClick('.form-group.date button');
    await expect(page).toClick('.form-group.daterange div.DatePicker__From button');
    await expect(page).toClick('.form-group.daterange div.DatePicker__To button');
    await expect(page).toClick('.form-group.multidate .multidate-item:nth-of-type(2) > button');
    await expect(page).toClick('.form-group.multidate .multidate-item:first-of-type > button');
    await expect(page).toClick(
      'div.form-group.multidaterange .multidate-item:nth-child(2) > div > button'
    );
    await expect(page).toClick(
      'div.form-group.multidaterange .multidate-item:nth-child(1) > div > button'
    );
    await scrollTo('.form-group.markdown');
    await clearInput('.form-group.markdown textarea');
    await clearInput('.form-group.link #label');
    await clearInput('.form-group.link #url');

    await scrollTo('.form-group #lat');
    await clearInput('.form-group #lat');
    await clearInput('.form-group #lon');

    await expect(page).toClick('button', { text: 'Save' });
    await expect(page).toClick('div.alert-success');
  });

  it('should not have metadata.', async () => {
    const metadataDivs = await page.$$('div.metadata.tab-content-visible div.view > dl > div');
    expect(metadataDivs.length).toBe(0);
  });

  afterAll(async () => {
    await logout();
  });
});
