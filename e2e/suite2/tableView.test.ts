/*global page*/

import { host } from '../config';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import { scrollTo } from '../helpers/formActions';
import { adminLogin, logout } from '../helpers/login';
import disableTransitions from '../helpers/disableTransitions';
import { prepareToMatchImageSnapshot, testSelectorShot } from '../helpers/regression';

prepareToMatchImageSnapshot();

describe('Table view', () => {
  const sidePanelItemNameSelector = '.sidepanel-body .item-name';

  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  const selectAllColumns = async () => {
    await page.click('.hidden-columns-dropdown');
    const showAllSelector = "#rw_1_listbox > li:nth-child(1) > input[type='checkbox']";
    await page.$$eval(showAllSelector, item => {
      (<HTMLInputElement>item[0]).checked = false;
      (<HTMLInputElement>item[0]).click();
    });
    await page.waitForSelector('.tableview-wrapper th:nth-child(6)');
  };

  it('Should go to the table view', async () => {
    await page.goto(`${host}/library/table`);
    await disableTransitions();
    await page.waitForSelector('.tableview-wrapper > table > tbody > tr');
  });

  describe('Table actions', () => {
    it('Should show only selected properties', async () => {
      await page.click('.hidden-columns-dropdown');
      await page.waitForSelector('#rw_1_listbox li');
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
      await page.click('.hidden-columns-dropdown');
      await page.waitForSelector('.tableview-wrapper');

      const optionSelector = '.tableview-wrapper th';
      const visibleColumns = await page.$$eval(optionSelector, columns =>
        columns.map(column => column.textContent)
      );
      expect(selectedColumns).toEqual(visibleColumns);
    });

    it('Should show new selected properties', async () => {
      await page.click('.rw-select');
      await expect(page).toClick('.rw-list-option>span', { text: 'Mecanismo' });
      await expect(page).toClick('.rw-list-option>span', { text: 'Firmantes' });
      await page.click('.tableview-wrapper');
      await expect(page).toMatchElement('.tableview-wrapper th:last-child', { text: 'Firmantes' });
      await expect(page).toMatchElement('.tableview-wrapper th:nth-last-child(3)', {
        text: 'Mecanismo',
      });
      await expect(page).not.toMatchElement('.hidden-columns-dropdown .rw-open');
    });

    it('Should show all properties if all of them are selected', async () => {
      await selectAllColumns();
      const optionsSelector = '#rw_1_listbox li';
      const headerColumnSelector = '.tableview-wrapper th';
      const optionsCount = await page.$$eval(optionsSelector, options => options.length);
      const columnsCount = await page.$$eval(headerColumnSelector, columns => columns.length);
      expect(optionsCount).toEqual(columnsCount);
    });

    it('Should open the selected entity in the side panel', async () => {
      const rowCheckboxSelector = ".tableview-wrapper .sticky-col input[type='checkbox']";
      const entityTitle = await page.$$eval(rowCheckboxSelector, columns => {
        (<HTMLInputElement>columns[4]).click();
        return columns[4].textContent;
      });
      await page.waitForSelector(sidePanelItemNameSelector);
      await expect(page).toMatchElement(sidePanelItemNameSelector, {
        text: entityTitle?.toString(),
      });
    });

    it('should show multiple selection panel when several entities are checked', async () => {
      const rowCheckboxSelector = ".tableview-wrapper .sticky-col input[type='checkbox']";
      await page.$$eval(rowCheckboxSelector, columns =>
        columns
          .filter((_column, index) => [3, 6, 9, 12].includes(index))
          .forEach(column => {
            (<HTMLInputElement>column).click();
          })
      );
      await expect(page).toMatchElement('div.sidepanel-header > span', { text: '5 selected' });
      await expect(page).toMatchElement('div.sidepanel-body > ul > li:nth-child(1) > span', {
        text: 'Artavia Murillo et al. Preliminary Objections, Merits, Reparations and Costs. Judgment. November 28, 2012',
      });
      await expect(page).toMatchElement('div.sidepanel-body > ul > li:nth-child(2) > span', {
        text: 'Artavia Murillo y otros. Resolución del Presidente de la Corte de 6 de agosto de 2012',
      });
      await expect(page).toMatchElement('div.sidepanel-body > ul > li:nth-child(5) > span', {
        text: 'Alvarez et al. Order of the President. August 14, 1997',
      });
    });
    it('should uncheck selected rows and show the clicked entity row on the side panel', async () => {
      const rowSelector = 'div.tableview-wrapper > table > tbody > tr:nth-child(2)';
      await expect(page).toClick(rowSelector);
      await expect(page).not.toMatchElement('div.sidepanel-header > span', { text: '5 selected' });
      await expect(page).toMatchElement(sidePanelItemNameSelector, {
        text: 'Artavia Murillo y otros',
      });
    });

    it('Should load more rows on demand', async () => {
      const rowSelector = '.tableview-wrapper > table > tbody > tr';
      expect((await page.$$(rowSelector)).length).toBe(30);

      await scrollTo('.btn-load-more');
      await expect(page.click('.btn-load-more'));
      await page.waitForNavigation();
      await disableTransitions();
      await page.waitForSelector(rowSelector);
      expect((await page.$$(rowSelector)).length).toBe(60);
    });

    describe('Scrolling', () => {
      it('Should scroll vertically and keep the sticky header', async () => {
        await scrollTo('.btn-load-more');
        await testSelectorShot('.library-viewer.document-viewer.unpinned-mode');
      });

      it('Should scroll horizontaly and keep the search bar visible', async () => {
        await scrollTo('.tableview-wrapper > table > thead > tr > th:nth-child(11)');
        await testSelectorShot('.library-viewer.document-viewer.unpinned-mode');
      });
    });
  });

  afterAll(async () => {
    await logout();
  });
});
