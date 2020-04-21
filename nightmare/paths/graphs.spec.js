import { catchErrors } from 'api/utils/jasmineHelpers';
import createNightmare from '../helpers/nightmare';
import insertFixtures from '../helpers/insertFixtures';
import { loginAsAdminAndGoToSettings } from '../helpers/commonTests';
import selectors from '../helpers/selectors';

const localSelectors = {
  pagesButton:
    '#app > div.content > div > div > div.settings-navigation > div > div:nth-child(1) > div.list-group > a:nth-child(5)',
  createNewPageButton:
    '#app > div.content > div > div > div.settings-content > div > div.settings-footer > a',
  savePageButton:
    '#app > div.content > div > div > div.settings-content > div > form > div.settings-footer > button.save-template',
  pageTitleInput:
    '#app div.settings-content div.panel.panel-default div.metadataTemplate-heading.panel-heading > div > div > input',
  pageContentsInput:
    '#app div.settings-content div.document-viewer div.tab-content.tab-content-visible > textarea',
};

const nightmare = createNightmare();

const graphs = {
  barChart: '<BarChart property="super_powers" context="58ad7d240d44252fee4e6208" />',
  pieChart: '<PieChart property="super_powers" context="58ad7d240d44252fee4e6208" />',
};

describe('pages path', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  describe('login', () => {
    it('should log in as admin then click the settings nav button', done => {
      loginAsAdminAndGoToSettings(nightmare, catchErrors, done);
    });
  });

  describe('Graphs in Page', () => {
    it('should create a basic page', async () => {
      await nightmare
        .goto('http://localhost:3000/en/settings')
        .clickLink('Pages')
        .clickLink('Add page')
        .wait('.page-creator')
        .write(localSelectors.pageTitleInput, 'Page data viz2')
        .write(localSelectors.pageContentsInput, '</p><Dataset />')
        .clickLink('Save')
        .wait(1000);

      await nightmare.getInnerText('.document-viewer > div.alert-info a').then(text => {
        expect(text).toContain('(view page)');
      });
    });

    it('should insert Bar chart graph in created page', async () => {
      nightmare
        .evaluate(
          selector => document.querySelector(selector).value,
          localSelectors.pageContentsInput
        )
        .then(text => {
          expect(text).toContain('<Dataset />');
          return nightmare
            .write(localSelectors.pageContentsInput, graphs.barChart)
            .click(localSelectors.savePageButton);
        });
    });

    // it('should display Bar chart graph in page', async () => {
    //   await nightmare
    //     .clickLink('view page')
    //     .wait('#app > div.content > div > div > main div.markdown-viewer');
    // });
  });
});
