/*global page*/
import sharp from 'sharp';
import { ElementHandle } from 'puppeteer';
import { ensure } from 'shared/tsUtils';
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import { displayGraph } from '../helpers/graphs';
import disableTransitions from '../helpers/disableTransitions';

const localSelectors = {
  pageContentsInput: '.tab-content > textarea',
  createdPageLink: '.document-viewer > div.alert-info a',
};

let graphsPage: any;

const graphs = {
  barChart: '<BarChart property="tipo" context="58ada34c299e8267485450fb" />',
  pieChart: '<PieChart property="tipo" context="58ada34c299e8267485450fb" />',
  listChart: '<ListChart property="tipo" context="58ada34c299e8267485450fb" excludeZero="true" />',
  barChartScatter: '<BarChart property="categor_a" scatter="true"/>',
  pieChartScatter: '<PieChart property="categor_a" scatter="true"/>',
  listChartScatter: '<ListChart property="categor_a" excludeZero="true" scatter="true"/>',
};

const resizeImage = async (image: any, length: number, width: number) =>
  sharp(image)
    .resize(length, width)
    .toBuffer();

const insertChart = async (chart: string, chartName: string) => {
  await expect(page).toFill('input[name="page.data.title"]', chartName);
  await expect(page).toFill(localSelectors.pageContentsInput, '<Dataset />');
  await page.type(localSelectors.pageContentsInput, chart);
};

const savePage = async () => {
  await expect(page).toMatchElement('button', { text: 'Save' });
  await expect(page).toClick('button', { text: 'Save' });
  await expect(page).toMatch('Saved successfully.');
  await expect(page).toMatch('(view page)');
};

const getChartContainerScreenshot = async (page: any, className: string) => {
  const chartContainer = ensure<ElementHandle>(await page.$(className));
  return chartContainer.screenshot();
};

describe('Graphs in Page ', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  it('should create a basic page', async () => {
    await expect(page).toClick('a', { text: 'Account settings' });
    await expect(page).toClick('a', { text: 'Pages' });
    await expect(page).toClick('a', { text: 'Add page' });
    await expect(page).toFill('input[name="page.data.title"]', 'Bar chart graph');
    await expect(page).toFill(localSelectors.pageContentsInput, '<Dataset />');
    await savePage();
  });

  describe('Graphs for regular thesauri', () => {
    beforeEach(async () => {
      graphsPage = await displayGraph();
    });
    it('should insert Bar chart graph in created page', async () => {
      const pageContentsInput = await page.$eval(
        localSelectors.pageContentsInput,
        el => el.textContent
      );
      expect(pageContentsInput).toContain('<Dataset />');

      await page.type(localSelectors.pageContentsInput, graphs.barChart);
      await savePage();
    });

    it('should display Bar chart graph in page with no more than a 7% difference', async () => {
      const chartScreenshot = await getChartContainerScreenshot(
        graphsPage,
        '.recharts-responsive-container'
      );
      const resizedChart = await resizeImage(chartScreenshot, 1000, 320);

      expect(resizedChart).toMatchImageSnapshot({
        failureThreshold: 0.07,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
      await graphsPage.close();
    });

    it('should navigate back to the edit page and insert a Pie chart graph', async () => {
      await page.goBack();
      await insertChart(graphs.pieChart, 'Pie chart graph');
      await savePage();
    });

    it('should display Pie chart graph in page with no more than a 7% difference', async () => {
      const chartScreenshot = await getChartContainerScreenshot(
        graphsPage,
        '.recharts-responsive-container'
      );
      const resizedChart = await resizeImage(chartScreenshot, 1000, 222);

      expect(resizedChart).toMatchImageSnapshot({
        failureThreshold: 0.07,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
      await graphsPage.close();
    });

    it('should navigate back to the edit page and insert a List chart graph', async () => {
      await page.goBack();
      await insertChart(graphs.listChart, 'List chart graph');
      await savePage();
    });

    it('should display List chart graph in page with no more than a 7% difference', async () => {
      const chartScreenshot = await getChartContainerScreenshot(graphsPage, '.ListChart');
      const resizedChart = await resizeImage(chartScreenshot, 1000, 526);

      expect(resizedChart).toMatchImageSnapshot({
        failureThreshold: 0.07,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
      await graphsPage.close();
    });
  });

  describe('Graphs with nested thesaurus', () => {
    beforeEach(async () => {
      graphsPage = await displayGraph();
    });
    it('should insert Bar chart graph in created page', async () => {
      const pageContentsInput = await page.$eval(
        localSelectors.pageContentsInput,
        el => el.textContent
      );
      await expect(page).toFill('input[name="page.data.title"]', 'Bar chart with nested graph');
      expect(pageContentsInput).toContain('<Dataset />');

      await page.type(localSelectors.pageContentsInput, graphs.barChartScatter);
      await savePage();
    });

    it('should display Bar chart graph in page with no more than a 7% difference', async () => {
      const chartScreenshot = await getChartContainerScreenshot(
        graphsPage,
        '.recharts-responsive-container'
      );
      const resizedChart = await resizeImage(chartScreenshot, 1000, 320);
      expect(resizedChart).toMatchImageSnapshot({
        failureThreshold: 0.07,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
      await graphsPage.close();
    });

    it('should navigate back to the edit page and insert a Pie chart graph', async () => {
      await page.goBack();
      await expect(page).toFill('input[name="page.data.title"]', 'Pie chart with nested graph');
      await expect(page).toFill(localSelectors.pageContentsInput, '<Dataset />');
      await page.type(localSelectors.pageContentsInput, graphs.pieChartScatter);
      await insertChart(graphs.pieChartScatter, 'Pie chart with nested graph');
      await savePage();
    });

    it('should display Pie chart graph in page with no more than a 7% difference', async () => {
      const chartScreenshot = await getChartContainerScreenshot(
        graphsPage,
        '.recharts-responsive-container'
      );
      const resizedChart = await resizeImage(chartScreenshot, 1000, 222);
      expect(resizedChart).toMatchImageSnapshot({
        failureThreshold: 0.07,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
      await graphsPage.close();
    });

    it('should navigate back to the edit page and insert a List chart graph', async () => {
      await page.goBack();
      await insertChart(graphs.listChartScatter, 'List chart with nested graph');
      await savePage();
    });

    it('should display List chart graph in page with no more than a 8% difference', async () => {
      const chartScreenshot = await getChartContainerScreenshot(graphsPage, '.ListChart');
      const resizedChart = await resizeImage(chartScreenshot, 1000, 408);
      expect(resizedChart).toMatchImageSnapshot({
        failureThreshold: 0.08,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
      await graphsPage.close();
    });
  });

  afterAll(async () => {
    await logout();
  });
});
