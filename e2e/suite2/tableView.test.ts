/*global page*/

import { host } from '../config';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import { adminLogin, logout } from '../helpers/login';
import disableTransitions from '../helpers/disableTransitions';

describe('Table view', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  it('Should go to the table view', async () => {
    await page.goto(`${host}/library/table`);
    await disableTransitions();
    await page.waitForSelector('.tableview-wrapper > table > tbody > tr');
  });

  describe('Table actions', () => {
    it('Should show only selected properties', async () => {
      await page.click('.hidden-columns-dropdown');
      await page.waitForSelector('#rw_2_listbox li');
      const columnsOptions = await page.$$eval('#rw_2_listbox li', options =>
        options.map(option => ({
          checked: (<HTMLInputElement>option.children[0]).checked,
          option: option.textContent,
        }))
      );
      const selectedColumns = columnsOptions
        .filter(option => option.checked)
        .map(option => option.option);
      selectedColumns[0] = 'Title';
      await page.click('.hidden-columns-dropdown');
      await page.waitForSelector('.tableview-wrapper');

      const optionSelector = '.tableview-wrapper th';
      const visibleColumns = await page.$$eval(optionSelector, columns =>
        columns.map(column => column.textContent)
      );
      expect(selectedColumns).toEqual(visibleColumns);
    });

    it('Should show new selected properties', async () => {
      await page.click('.hidden-columns-dropdown');
      await expect(page).toClick('.rw-list-option', { text: 'Mecanismo' });
      await expect(page).toClick('.rw-list-option', { text: 'Firmantes' });
      await page.click('.tableview-wrapper');
      await expect(page).toMatchElement('.tableview-wrapper th:last-child', { text: 'Firmantes' });
      await expect(page).toMatchElement('.tableview-wrapper th:nth-last-child(3)', {
        text: 'Mecanismo',
      });
      await expect(page).not.toMatchElement('.hidden-columns-dropdown .rw-open');
    });

    it('Should show all properties if all of them are selected', async () => {
      await page.click('.hidden-columns-dropdown');
      const showAllSelector = "#rw_2_listbox > li:nth-child(1) > input[type='checkbox']";
      await page.$$eval(showAllSelector, item => {
        (<HTMLInputElement>item[0]).checked = false;
        (<HTMLInputElement>item[0]).click();
      });
      await page.waitForSelector('.tableview-wrapper th:nth-child(6)');
      const optionsSelector = '#rw_2_listbox li';
      const headerColumnSelector = '.tableview-wrapper th';
      const optionsCount = await page.$$eval(optionsSelector, options => options.length);
      const columnsCount = await page.$$eval(headerColumnSelector, columns => columns.length);
      expect(optionsCount).toEqual(columnsCount);
    });

    it('Should open the selected entity in the side panel', async () => {
      const rowCheckboxSelector = ".tableview-wrapper .sticky-col input[type='checkbox']";
      const sidePanelItemNameSelector = '.sidepanel-body .item-name';
      const entityTitle = await page.$$eval(rowCheckboxSelector, columns => {
        (<HTMLInputElement>columns[4]).click();
        return columns[4].textContent;
      });
      await page.waitForSelector(sidePanelItemNameSelector);
      await expect(page).toMatchElement(sidePanelItemNameSelector, {
        text: entityTitle?.toString(),
      });
    });

    it('Should load more rows if scrolling reach the end of content', async () => {
      const rowSelector = '.tableview-wrapper > table > tbody > tr';
      const lastRowSelector = '.tableview-wrapper > table > tbody > tr:last-child';
      await page.$$eval(lastRowSelector, el => el[0].scrollIntoView());
      await page.waitForSelector('.tableview-wrapper > table > tbody > tr:nth-child(32)');
      const rowsNumber = await page.$$eval(rowSelector, rows => rows.length);
      expect(rowsNumber).toBe(60);
    });
  });

  afterAll(async () => {
    await logout();
  });
});
