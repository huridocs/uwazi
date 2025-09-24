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
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.click('.hidden-columns-dropdown');
    const showAllSelector = "#rw_1_listbox > li:nth-child(1) > input[type='checkbox']";
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.$$eval(showAllSelector, item => {
      (<HTMLInputElement>item[0]).checked = false;
      (<HTMLInputElement>item[0]).click();
    });
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.waitForSelector('.tableview-wrapper th:nth-child(6)');
  };

  it('Should go to the table view', async () => {
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.goto(`${host}/library/table`);
    await disableTransitions();
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await page.waitForSelector('.tableview-wrapper > table > tbody > tr');
  });

  describe('Table actions', () => {
    it('Should show only selected properties', async () => {
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await page.click('.hidden-columns-dropdown');
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await page.waitForSelector('#rw_1_listbox li');
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      const columnsOptions = await page.$$eval('#rw_1_listbox li', options =>
        // @ts-expect-error TS(7006): Parameter 'option' implicitly has an 'any' type.
        options.map(option => ({
          checked: (<HTMLInputElement>option.children[0]).checked,
          option: option.textContent,
        }))
      );
      const selectedColumns = columnsOptions
        // @ts-expect-error TS(7006): Parameter 'option' implicitly has an 'any' type.
        .filter(option => option.checked)
        // @ts-expect-error TS(7006): Parameter 'option' implicitly has an 'any' type.
        .map(option => option.option);
      selectedColumns[0] = 'Title';
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await page.click('.hidden-columns-dropdown');
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await page.waitForSelector('.tableview-wrapper');

      const optionSelector = '.tableview-wrapper th';
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      const visibleColumns = await page.$$eval(optionSelector, columns =>
        // @ts-expect-error TS(7006): Parameter 'column' implicitly has an 'any' type.
        columns.map(column => column.textContent)
      );
      expect(selectedColumns).toEqual(visibleColumns);
    });

    it('Should show new selected properties', async () => {
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await page.click('.rw-select');
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toClick('.rw-list-option>span', { text: 'Mecanismo' });
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toClick('.rw-list-option>span', { text: 'Firmantes' });
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await page.click('.tableview-wrapper');
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toMatchElement('.tableview-wrapper th:last-child', { text: 'Firmantes' });
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toMatchElement('.tableview-wrapper th:nth-last-child(2)', {
        text: 'Mecanismo',
      });
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).not.toMatchElement('.hidden-columns-dropdown .rw-open');
    });

    it('Should show all properties if all of them are selected', async () => {
      await selectAllColumns();
      const optionsSelector = '#rw_1_listbox li';
      const headerColumnSelector = '.tableview-wrapper th';
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      const optionsCount = await page.$$eval(optionsSelector, options => options.length);
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      const columnsCount = await page.$$eval(headerColumnSelector, columns => columns.length);
      expect(optionsCount).toEqual(columnsCount);
    });

    it('Should open the selected entity in the side panel', async () => {
      const rowCheckboxSelector = ".tableview-wrapper .sticky-col input[type='checkbox']";
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      const entityTitle = await page.$$eval(rowCheckboxSelector, columns => {
        (<HTMLInputElement>columns[4]).click();
        return columns[4].textContent;
      });
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await page.waitForSelector(sidePanelItemNameSelector);
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toMatchElement(sidePanelItemNameSelector, {
        text: entityTitle?.toString(),
      });
    });

    it('should show multiple selection panel when several entities are checked', async () => {
      const rowCheckboxSelector = ".tableview-wrapper .sticky-col input[type='checkbox']";
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await page.$$eval(rowCheckboxSelector, columns =>
        columns
          // @ts-expect-error TS(7006): Parameter '_column' implicitly has an 'any' type.
          .filter((_column, index) => [3, 6, 9, 12].includes(index))
          // @ts-expect-error TS(7006): Parameter 'column' implicitly has an 'any' type.
          .forEach(column => {
            (<HTMLInputElement>column).click();
          })
      );
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toMatchElement('div.sidepanel-header > span', { text: '5 selected' });
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toMatchElement('div.sidepanel-body > ul > li:nth-child(1) > span', {
        text: 'Artavia Murillo et al. Preliminary Objections, Merits, Reparations and Costs. Judgment. November 28, 2012',
      });
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toMatchElement('div.sidepanel-body > ul > li:nth-child(2) > span', {
        text: 'Artavia Murillo y otros. Resolución del Presidente de la Corte de 6 de agosto de 2012',
      });
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toMatchElement('div.sidepanel-body > ul > li:nth-child(5) > span', {
        text: 'Alvarez et al. Order of the President. August 14, 1997',
      });
    });

    it('should uncheck selected rows and show the clicked entity row on the side panel', async () => {
      const rowSelector = 'div.tableview-wrapper > table > tbody > tr:nth-child(2)';
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toClick(rowSelector);
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).not.toMatchElement('div.sidepanel-header > span', { text: '5 selected' });
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toMatchElement(sidePanelItemNameSelector, {
        text: 'Artavia Murillo y otros',
      });
    });

    it('Should load more rows on demand', async () => {
      const rowSelector = '.tableview-wrapper > table > tbody > tr';
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      expect((await page.$$(rowSelector)).length).toBe(30);

      await scrollTo('.btn-load-more');
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page.click('.btn-load-more'));
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await page.waitForNavigation();
      await disableTransitions();
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toMatchElement('span', { text: '60 shown of' });
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await page.waitForSelector(rowSelector);
      // @ts-expect-error TS(2304): Cannot find name 'page'.
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
