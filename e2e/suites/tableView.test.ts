/*global page*/

import { host } from '../config';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';

describe('Table view', () => {
  beforeAll(async () => {
    jest.setTimeout(60000);
    await insertFixtures();
    await proxyMock();
    await page.goto(`${host}/library/table`);
    await page.waitFor(300);
  });

  afterAll(async () => {
    jest.setTimeout(40000);
  });

  describe('Column selector', () => {
    it('Should show only selected properties', async () => {
      await page.click('.hidden-columns-dropdown');
      const columnsOptions = await page.$$eval('#rw_1_listbox li', options =>
        options.map(option => ({
          checked: (<HTMLInputElement>option.children[0]).checked,
          option: option.textContent,
        }))
      );
      const selectedColumns = columnsOptions
        .filter(option => option.checked)
        .map(option => option.option);
      selectedColumns[0] = 'Title';
      await page.waitFor('.tableview-wrapper');
      const optionSelector = '.tableview-wrapper th';
      const visibleColumns = await page.$$eval(optionSelector, columns =>
        columns.map(column => column.textContent)
      );
      expect(selectedColumns).toEqual(visibleColumns);
    });

    it('Should show new selected properties', async () => {
      const newColumn = await page.$$eval('#rw_1_listbox li:nth-child(9)', option => {
        (<HTMLInputElement>option[0]).click();
        return option[0].textContent;
      });
      await page.waitFor(300);
      const lastColumn = await page.$$eval(
        '.tableview-wrapper th:last-child',
        columns => columns[0].textContent
      );
      expect(lastColumn).toEqual(newColumn);
    });
  });

  it('Should show all properties if all of them are selected', async () => {
    await page.click('.hidden-columns-dropdown');
    const showAllSelector = "#rw_1_listbox > li:nth-child(1) > input[type='checkbox']";
    await page.$$eval(showAllSelector, item => {
      (<HTMLInputElement>item[0]).checked = false;
      (<HTMLInputElement>item[0]).click();
    });
    await page.waitFor(300);
    const optionsSelector = '#rw_1_listbox li';
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
    await page.waitFor(sidePanelItemNameSelector);
    await expect(page).toMatchElement(sidePanelItemNameSelector, { text: entityTitle?.toString() });
  });

  it('Should show more rows if asked for', async () => {
    const showMoreSelector = '.btn-load-more:nth-child(1)';
    const rowSelector = '.tableview-wrapper > table > tbody > tr';
    await page.click(showMoreSelector);
    await page.waitFor(300);
    const rowsNumber = await page.$$eval(rowSelector, rows => rows.length);
    expect(rowsNumber).toBe(60);
  });
});
