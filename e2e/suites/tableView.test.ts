import { host } from '../config';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';

describe('Table view', () => {
	beforeAll(async () => {
		await insertFixtures();
		await proxyMock();
		await page.goto(`${host}/library/table`);
	});
	
	describe('Column selector', () => {
		let columnsOptions: any[];
		
		beforeAll(async () => {
			await page.click('.hidden-columns-dropdown');
			columnsOptions = await page.$$eval('#rw_1_listbox > li', options =>
				options.map(option => ({
					checked: (<HTMLInputElement>option.children[0]).checked,
					option: option.textContent,
				}))
			);
		});
		
		it('Should show only selected properties', async () => {
			const selectedColumns = columnsOptions
				.filter(option => option.checked)
				.map(option => option.option);
			selectedColumns[0] = 'Title';
			await page.waitFor('.tableview-wrapper');
			const optionSelector = '.tableview-wrapper > table > thead > tr > th';
			const visibleColumns = await page.$$eval(optionSelector, columns =>
				columns.map(column => column.textContent)
			);
			expect(selectedColumns).toEqual(visibleColumns);
		});
		
		it('Should show new selected properties', async () => {
			await page.click('.hidden-columns-dropdown');
			await page.click('#rw_1_listbox > li:nth-child(9)');
			await page.waitFor(200);
			const lastColumn = await page.$$eval(
				'.tableview-wrapper > table > thead > tr > th:last-child',
				columns => columns[0].textContent
			);
			expect(lastColumn).toEqual(columnsOptions[8].option);
		});
	});
	
	it('Should show all properties if all of them are selected', async () => {
		await page.click('.hidden-columns-dropdown');
		const showAllSelector = "#rw_1_listbox > li:nth-child(1) > input[type='checkbox']";
		await page.$$eval(showAllSelector, item => {
			(<HTMLInputElement>item[0]).checked = false;
			(<HTMLInputElement>item[0]).click();
		});
		await page.waitFor(2000);
		const optionsSelector = '#rw_1_listbox > li';
		const headerColumnSelector = '.tableview-wrapper > table > thead > tr > th';
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
		await page.waitFor(2000);
		const rowsNumber = await page.$$eval(rowSelector, rows => rows.length);
		expect(rowsNumber).toBe(60);
	});
});
