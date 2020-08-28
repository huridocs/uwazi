/*global page*/

import { host } from '../config';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';

describe('Table view', () => {
  beforeAll(async done => {
    await insertFixtures();
    await proxyMock();
    await page.goto(`${host}/library/table`);
    await page.waitFor('.documents-counter');
    await page.waitFor('.tableview-wrapper');
    done();
  });

  describe('Table actions', () => {
    beforeAll(async done => {
      const timeWaitedForFixtures = 8000;
      await page.waitFor(timeWaitedForFixtures);
      done();
    });

    it('Should show only selected properties', async done => {
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
      done();
    });

    it('Should show new selected properties', async done => {
      const newColumn = await page.$$eval('#rw_1_listbox li:nth-child(9)', option => {
        (<HTMLInputElement>option[0]).click();
        return option[0].textContent;
      });
      await page.waitFor(200);
      const lastColumn = await page.$$eval(
        '.tableview-wrapper th:last-child',
        columns => columns[0].textContent
      );
      expect(lastColumn).toEqual(newColumn);
      done();
    });

    it('Should show all properties if all of them are selected', async done => {
      await page.click('.hidden-columns-dropdown');
      const showAllSelector = "#rw_1_listbox > li:nth-child(1) > input[type='checkbox']";
      await page.$$eval(showAllSelector, item => {
        (<HTMLInputElement>item[0]).checked = false;
        (<HTMLInputElement>item[0]).click();
      });
      await page.waitFor(200);
      const optionsSelector = '#rw_1_listbox li';
      const headerColumnSelector = '.tableview-wrapper th';
      const optionsCount = await page.$$eval(optionsSelector, options => options.length);
      const columnsCount = await page.$$eval(headerColumnSelector, columns => columns.length);
      expect(optionsCount).toEqual(columnsCount);
      done();
    });

    it('Should open the selected entity in the side panel', async done => {
      const rowCheckboxSelector = ".tableview-wrapper .sticky-col input[type='checkbox']";
      const sidePanelItemNameSelector = '.sidepanel-body .item-name';
      const entityTitle = await page.$$eval(rowCheckboxSelector, columns => {
        (<HTMLInputElement>columns[4]).click();
        return columns[4].textContent;
      });
      await page.waitFor(sidePanelItemNameSelector);
      await expect(page).toMatchElement(sidePanelItemNameSelector, {
        text: entityTitle?.toString(),
      });
      done();
    });

    it('Should load more rows if scrolling reach the end of content', async done => {
      const rowSelector = '.tableview-wrapper > table > tbody > tr';
      const lastRowSelector = '.tableview-wrapper > table > tbody > tr:last-child';
      await page.$$eval(lastRowSelector, el => el[0].scrollIntoView());
      await page.waitFor(200);
      const rowsNumber = await page.$$eval(rowSelector, rows => rows.length);
      expect(rowsNumber).toBe(60);
      done();
    });
  });
});
