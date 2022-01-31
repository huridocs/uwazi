/*global page*/
import { ElementHandle } from 'puppeteer';
import { ensure } from '../../app/shared/tsUtils';
import { adminLogin, logout } from '../../e2e/helpers/login';
import proxyMock from '../../e2e/helpers/proxyMock';
import insertFixtures from '../../e2e/helpers/insertFixtures';
import { displayGraph } from '../helpers/graphs';
import disableTransitions from '../../e2e/helpers/disableTransitions';

const localSelectors = {
  pageContentsInput: '.tab-content > textarea',
  createdPageLink: '.document-viewer > div.alert-info a',
};

const graphs = {
  barChart: '<BarChart property="tipo" context="58ada34c299e8267485450fb" />',
  pieChart: '<PieChart property="tipo" context="58ada34c299e8267485450fb" />',
  listChart: '<ListChart property="tipo" context="58ada34c299e8267485450fb" excludeZero="true" />',
  barChartScatter: '<BarChart property="categor_a" scatter="true"/>',
  pieChartScatter: '<PieChart property="categor_a" scatter="true"/>',
  listChartScatter: '<ListChart property="categor_a" excludeZero="true" scatter="true"/>',
};

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

const takeScreenshot = async (element: string) => {
  const graphsPage = await displayGraph();
  await graphsPage.waitForSelector(element);
  const chartContainer = ensure<ElementHandle>(await graphsPage.$(element));
  const chartScreenshot = await chartContainer.screenshot();
  return { graphsPage, chartScreenshot };
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
    it('should insert Bar chart graph in created page', async () => {
      await page.waitForFunction(
        `document.querySelector('${localSelectors.pageContentsInput}').textContent`
      );
      const pageContentsInput = await page.$eval(
        localSelectors.pageContentsInput,
        el => el.textContent
      );
      expect(pageContentsInput).toContain('<Dataset />');

      await page.type(localSelectors.pageContentsInput, graphs.barChart);
      await savePage();
    });

    it('should display Bar chart graph', async () => {
      const { graphsPage, chartScreenshot } = await takeScreenshot(
        '.recharts-responsive-container'
      );
      expect(chartScreenshot).toMatchImageSnapshot();
      await graphsPage.close();
    });

    it('should navigate back to the edit page and insert a Pie chart graph', async () => {
      await page.goBack();
      await insertChart(graphs.pieChart, 'Pie chart graph');
      await savePage();
    });

    it('should display Pie chart graph', async () => {
      const { graphsPage, chartScreenshot } = await takeScreenshot(
        '.recharts-responsive-container'
      );

      expect(chartScreenshot).toMatchImageSnapshot();
      await graphsPage.close();
    });

    it('should navigate back to the edit page and insert a List chart graph', async () => {
      await page.goBack();
      await insertChart(graphs.listChart, 'List chart graph');
      await savePage();
    });

    it('should display List chart graph', async () => {
      const { graphsPage, chartScreenshot } = await takeScreenshot('.ListChart');
      expect(chartScreenshot).toMatchImageSnapshot();
      await graphsPage.close();
    });
  });

  describe('Graphs with nested thesaurus', () => {
    let graphsPage: any;
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

    it('should display Bar chart graph', async () => {
      const chartContainer = ensure<ElementHandle>(
        await graphsPage.$('.recharts-responsive-container')
      );
      const chartScreenshot = await chartContainer.screenshot();

      expect(chartScreenshot).toMatchImageSnapshot();
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

    it('should display Pie chart graph', async () => {
      const chartContainer = ensure<ElementHandle>(
        await graphsPage.$('.recharts-responsive-container')
      );
      const chartScreenshot = await chartContainer.screenshot();

      expect(chartScreenshot).toMatchImageSnapshot();
      await graphsPage.close();
    });

    it('should navigate back to the edit page and insert a List chart graph', async () => {
      await page.goBack();
      await insertChart(graphs.listChartScatter, 'List chart with nested graph');
      await savePage();
    });

    it('should display List chart graph', async () => {
      const chartContainer = ensure<ElementHandle>(await graphsPage.$('.ListChart'));
      const chartScreenshot = await chartContainer.screenshot();
      expect(chartScreenshot).toMatchImageSnapshot();
      await graphsPage.close();
    });
  });

  afterAll(async () => {
    await logout();
  });
});
