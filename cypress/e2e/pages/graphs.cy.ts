import { clearCookiesAndLogin } from '../helpers/login';

const graphs = {
  barChart: '<BarChart property="tipo" context="58ada34c299e8267485450fb" />',
  pieChart: '<PieChart property="tipo" context="58ada34c299e8267485450fb" />',
  listChart: '<ListChart property="tipo" context="58ada34c299e8267485450fb" excludeZero="true" />',
  barChartScatter: '<BarChart property="categor_a" scatter="true"/>',
  pieChartScatter: '<PieChart property="categor_a" scatter="true"/>',
  listChartScatter: '<ListChart property="categor_a" excludeZero="true" scatter="true"/>',
};

const insertChart = (chart: string, chartName: string) => {
  cy.clearAndType('input[name="title"]', chartName);
  cy.contains('Markdown').click();
  cy.get('div[data-mode-id="html"]').type(`<Dataset />\n${chart}`, {
    parseSpecialCharSequences: false,
  });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(501);
};

const savePage = () => {
  cy.contains('button.bg-success-700', 'Save').click();
  cy.contains('Saved successfully');
};

const visitPage = () => {
  cy.contains('a', 'View page').then(a => {
    const href = a.attr('href') || '';
    cy.visit(href);
  });
};

const newPage = () => {
  cy.contains('a', 'Settings').click();
  cy.contains('a', 'Pages').click();
  cy.contains('a', 'Add page').click();
};

const takeSnapshot = () => {
  cy.get('.markdown-viewer').should('be.visible');
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.get('.markdown-viewer').wait(2000).toMatchImageSnapshot();
};

const testChart = (chart: string, name: string) => {
  newPage();
  insertChart(chart, name);
  savePage();
  visitPage();
  takeSnapshot();
};

describe('Graphs in Page ', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin();
  });

  it('should insert Bar chart graph in created page', () => {
    testChart(graphs.barChart, 'Bar chart graph');
  });

  it('should insert Pie chart graph in created page', () => {
    testChart(graphs.pieChart, 'Pie chart graph');
  });

  it('should insert List chart graph in created page', () => {
    testChart(graphs.listChart, 'List chart graph');
  });

  it('should insert Bar chart with nested graph in created page', () => {
    testChart(graphs.barChartScatter, 'Bar chart with nested graph');
  });

  it('should insert Pie chart with nested graph in created page', () => {
    testChart(graphs.pieChartScatter, 'Pie chart with nested graph');
  });

  it('should insert List chart with nested graph in created page', () => {
    testChart(graphs.listChartScatter, 'List chart with nested graph');
  });
});
