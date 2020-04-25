/* eslint max-len: ["error", 500] */
import { catchErrors } from 'api/utils/jasmineHelpers';
import puppeteer from 'puppeteer';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import createNightmare from '../helpers/nightmare';
import insertFixtures from '../helpers/insertFixtures';
import { loginAsAdminAndGoToSettings } from '../helpers/commonTests';
import selectors from '../helpers/selectors';

expect.extend({ toMatchImageSnapshot });

const localSelectors = {
  pagesButton:
    '#app > div.content > div > div > div.settings-navigation > div > div:nth-child(1) > div.list-group > a:nth-child(5)',
  createNewPageButton:
    '#app > div.content > div > div > div.settings-content > div > div.settings-footer > a',
  savePageButton:
    '#app > div.content > div > div > div.settings-content > div > form > div.settings-footer > button.save-template',
  pageTitleInput:
    '#app > div.content > div > div > div.settings-content > div > form > div.panel.panel-default > div.metadataTemplate-heading.panel-heading > div > div > input',
  pageContentsInput:
    '#app > div.content > div > div > div.settings-content > div > form > div.panel.panel-default > div.panel-body.page-viewer.document-viewer > div > div.tab-content.tab-content-visible > textarea',
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
        });
      await nightmare
        .write(localSelectors.pageContentsInput, graphs.barChart)
        .click(localSelectors.savePageButton)
        .wait(4000);
    });

    it('should display Bar chart graph in page with no more than a 1% difference', async () => {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      const graphsPage = await nightmare
        .evaluate(
          () => document.querySelector('.page-viewer.document-viewer > div.alert.alert-info a').href
        )
        .then(link => link);
      await page.goto(graphsPage, { waitUntil: 'load' });
      const image = await page.screenshot();
      expect(image).toMatchImageSnapshot({
        failureThreshold: 0.01,
        failureThresholdType: 'percent',
        allowSizeMismatch: true,
      });
      await browser.close();
    });
  });
});
