import { clearCookiesAndLogin } from '../helpers/login';

const updateDatasetScript = `window.updatePageDatasets("default",{rows:[],totalRows:292,relation:"eq",aggregations:
{all:{tipo:{meta:{},doc_count:915,buckets:[{key:"57d8a9c4-f0cd-4290-b15e-ddf2b3c6ef91",doc_count:6,filtered:
{meta:{},doc_count:2},label:"De asunto"},{key:"d79ab686-a987-4a1e-a26a-0a604a5f3aae",doc_count:6,filtered:
{meta:{},doc_count:2},label:"En casos"}],count:11}}}});`;

const graphs = {
  barChart: '<BarChart property="tipo" context="58ada34c299e8267485450fb" />',
  pieChart: '<PieChart property="tipo" context="58ada34c299e8267485450fb" />',
  listChart: '<ListChart property="tipo" context="58ada34c299e8267485450fb" excludeZero="true" />',
  barChartScatter: '<BarChart property="categor_a" scatter="true"/>',
  pieChartScatter: '<PieChart property="categor_a" scatter="true"/>',
  listChartScatter: '<ListChart property="categor_a" excludeZero="true" scatter="true"/>',
};

const insertChart = (chart: string, chartName: string) => {
  cy.clearAndType('input[name="title"]', chartName, { delay: 0 });
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

  describe('dataset updates', () => {
    it('should update a graph via the page script using the updated function', () => {
      cy.contains('a', 'Settings').click();
      cy.contains('a', 'Pages').click();
      cy.contains('tr', 'Bar chart graph').contains('button', 'Edit').click();
      cy.contains('Javascript').click();
      // delete extra closing keys added by the code editor when writing this text
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('div[data-mode-id="javascript"]')
        .type(updateDatasetScript, {
          parseSpecialCharSequences: false,
          delay: 0,
        })
        .type('{backspace}{backspace}');
      // wait for editor to update
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(501);
      savePage();
      visitPage();
      takeSnapshot();
    });
  });
});
