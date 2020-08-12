/*global page*/

import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import { displayGraph } from '../helpers/graphs';

const localSelectors = {
  pageContentsInput: '.page-viewer.document-viewer > div > div.tab-content.tab-content-visible > textarea',
  createdPageLink: '.document-viewer > div.alert-info a',
};

const graphs = {
  barChart: '<BarChart property="tipo" context="58ada34c299e8267485450fb" />',
  pieChart: '<PieChart property="tipo" context="58ada34c299e8267485450fb" />',
  listChart:'<ListChart property="tipo" context="58ada34c299e8267485450fb" excludeZero="true" />',
};

describe('Graphs in Page', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
  });

  it('should create a basic page', async () => {
    await expect(page).toClick('a', { text: 'Account settings' });
    await expect(page).toClick('a', { text: 'Pages' });
    await expect(page).toClick('a', { text: 'Add page' });
    await expect(page).toFill('input[name="page.data.title"]', 'Bar chart graph');
    await expect(page).toFill(localSelectors.pageContentsInput, '<Dataset />');
    await expect(page).toMatchElement('button', { text: 'Save' });
    await expect(page).toClick('button', { text: 'Save' });
    await expect(page).toMatch('Saved successfully.');
    await expect(page).toMatch('(view page)');
  });

  it('should insert Bar chart graph in created page', async () => {
    const pageContentsInput = await page.$eval(localSelectors.pageContentsInput, el => (<HTMLInputElement>el).value);
    expect(pageContentsInput).toContain('<Dataset />');

    await page.type(localSelectors.pageContentsInput, graphs.barChart);
    await expect(page).toMatchElement('button', { text: 'Save' });
    await expect(page).toClick('button', { text: 'Save' });
    await expect(page).toMatch('Saved successfully.');
    await expect(page).toMatch('(view page)');
  });

  it('should display Bar chart graph in page with no more than a 3% difference', async () => {
    const graphsPage = await displayGraph();
    let chartContainer: HTMLElement | any;
    chartContainer = await graphsPage.$('.recharts-responsive-container');
    
    const chartScreenshot = await chartContainer.screenshot();
    expect(chartScreenshot).toMatchImageSnapshot({
      failureThreshold: 0.03,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
    await graphsPage.close();
  });

  it('should navigate back to the edit page and insert a Pie chart graph', async () => {
    await page.goBack();
    await expect(page).toFill('input[name="page.data.title"]', 'Pie chart graph');
    await expect(page).toFill(localSelectors.pageContentsInput, '<Dataset />');
    await page.type(localSelectors.pageContentsInput, graphs.pieChart);
    await expect(page).toMatchElement('button', { text: 'Save' });
    await expect(page).toClick('button', { text: 'Save' });
    await expect(page).toMatch('Saved successfully.');
    await expect(page).toMatch('(view page)');
  });

  it('should display Pie chart graph in page with no more than a 3% difference', async () => {
    const graphsPage = await displayGraph();
    let chartContainer: HTMLElement | any;
    chartContainer = await graphsPage.$('.recharts-responsive-container');
    
    const chartScreenshot = await chartContainer.screenshot();
    expect(chartScreenshot).toMatchImageSnapshot({
      failureThreshold: 0.03,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
    await graphsPage.close();
  });

  it('should navigate back to the edit page and insert a List chart graph', async () => {
    await page.goBack();
    await expect(page).toFill('input[name="page.data.title"]', 'List chart graph');
    await expect(page).toFill(localSelectors.pageContentsInput, '<Dataset />');
    await page.type(localSelectors.pageContentsInput, graphs.listChart);
    await expect(page).toMatchElement('button', { text: 'Save' });
    await expect(page).toClick('button', { text: 'Save' });
    await expect(page).toMatch('Saved successfully.');
    await expect(page).toMatch('(view page)');
  });

  it('should display List chart graph in page with no more than a 3% difference', async () => {
    const graphsPage = await displayGraph();
    let chartContainer: HTMLElement | any;
    chartContainer = await graphsPage.$('.ListChart ');
    
    const chartScreenshot = await chartContainer.screenshot();
    expect(chartScreenshot).toMatchImageSnapshot({
      failureThreshold: 0.03,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
    await graphsPage.close();
  });

  afterAll(async () => {
    await logout();
  });
});
