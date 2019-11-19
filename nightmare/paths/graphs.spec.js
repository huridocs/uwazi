/*eslint max-len: ["error", 500], */
import { catchErrors } from 'api/utils/jasmineHelpers';
import createNightmare from '../helpers/nightmare';
import insertFixtures from '../helpers/insertFixtures';
import { loginAsAdminAndGoToSettings } from '../helpers/commonTests';
import selectors from '../helpers/selectors';

const localSelectors = {
  pagesButton: '#app > div.content > div > div > div.settings-navigation > div > div:nth-child(1) > div.list-group > a:nth-child(5)',
  createNewPageButton: '#app > div.content > div > div > div.settings-content > div > div.settings-footer > a',
  savePageButton: '#app > div.content > div > div > div.settings-content > div > form > div.settings-footer > button.save-template',
  pageTitleInput: '#app > div.content > div > div > div.settings-content > div > form > div.panel.panel-default > div.metadataTemplate-heading.panel-heading > div > div > input',
  pageContentsInput: '#app > div.content > div > div > div.settings-content > div > form > div.panel.panel-default > div.panel-body.page-viewer.document-viewer > div > div.tab-content.tab-content-visible > textarea'
};

const nightmare = createNightmare();

const graphs = {
  barChart: '<BarChart property="super_powers" context="58ad7d240d44252fee4e6208" />',
  pieChart: '<PieChart property="super_powers" context="58ad7d240d44252fee4e6208" />'
};

describe('pages path', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  describe('login', () => {
    it('should log in as admin then click the settings nav button', (done) => {
      loginAsAdminAndGoToSettings(nightmare, catchErrors, done);
    });
  });

  describe('Graphs in Page', () => {
    it('should create a basic page', (done) => {
      nightmare
      .waitToClick(localSelectors.pagesButton)
      .waitToClick(localSelectors.createNewPageButton)
      .write(localSelectors.pageTitleInput, 'Page data viz')
      .write(localSelectors.pageContentsInput, '</p><Dataset />')
      .waitToClick('form > div.settings-footer > button.save-template')
      .wait('div.panel-body.page-viewer.document-viewer > div.alert.alert-info:first-of-type')
      .getInnerText('div.panel-body.page-viewer.document-viewer > div.alert.alert-info:first-of-type')
      .then((text) => {
        expect(text).toContain('/page');
        expect(text).toContain('(view page)');
      })
      .then(() => { done(); })
      .catch(catchErrors(done));
    });

    it('should insert Bar chart graph in created page', (done) => {
      nightmare
      .evaluate(() => document.querySelector('div.panel-body.page-viewer.document-viewer > div > div.tab-content.tab-content-visible > textarea').value)
      .then((input) => {
        expect(input).toContain('<Dataset />');

        return nightmare
        .write(localSelectors.pageContentsInput, graphs.barChart)
        .waitToClick(localSelectors.savePageButton)
        .then(() => { done(); })
        .catch(catchErrors(done));
      })
      .then(() => { done(); })
      .catch(catchErrors(done));
    });

    it('should display Bar chart graph in page', (done) => {
      nightmare
      .evaluate(() => document.querySelector('div.panel-body.page-viewer.document-viewer > div.alert.alert-info a').href)
      .then(link => nightmare.goto(link))
      .then((page) => {
        expect(page.code).toBe(200);

        return nightmare
        .wait('#app > div.content > div > div > main div.markdown-viewer')
        .getInnerHtml('#app > div.content > div > div > main div.markdown-viewer')
        .then((html) => {
          expect(html).toContain('class="BarChart "');
          expect(html).toContain('class="recharts-responsive-container"');
        });
      })
      .then(() => { done(); })
      .catch(catchErrors(done));
    });

    it('should navigate back to edit page', (done) => {
      nightmare
      .waitToClick(selectors.navigation.settingsNavButton)
      .wait(selectors.settingsView.settingsHeader)
      .waitToClick(localSelectors.pagesButton)
      .wait('#app > div.content > div > div > div.settings-content > div.panel-default > ul.pages')
      .wait(500)
      .evaluate(() => document.querySelector('div.settings-content > div.panel-default > ul.pages > li:nth-child(1) > a').text)
      .then((pageTitle) => {
        expect(pageTitle).toBe('Page data viz');
        return nightmare.evaluate(() => document.querySelector('div.settings-content > div.panel-default > ul.pages > li:nth-child(1) > a').href)
      })
      .then((link) => {
        expect(link).toContain('/pages/edit/');
        nightmare.goto(link);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should insert Pie chart graph in page', (done) => {
      nightmare
      .evaluate(() => document.querySelector('div.panel-body.page-viewer.document-viewer > div > div.tab-content.tab-content-visible > textarea').value = "")
      .write(localSelectors.pageContentsInput, '</p><Dataset />')
      .write(localSelectors.pageContentsInput, graphs.pieChart)
      .waitToClick(localSelectors.savePageButton)
      .wait('div.panel-body.page-viewer.document-viewer > div.alert.alert-info:first-of-type')
      .getInnerText('div.panel-body.page-viewer.document-viewer > div.alert.alert-info:first-of-type')
      .then((text) => {
        expect(text).toContain('/page');
        expect(text).toContain('(view page)');
      })
      .then(() => { done(); })
      .catch(catchErrors(done));
    });

    it('should display Pie chart graph in edited page', (done) => {
      nightmare
      .evaluate(() => document.querySelector('div.panel-body.page-viewer.document-viewer > div.alert.alert-info a').href)
      .then(link => nightmare.goto(link))
      .then((page) => {
        expect(page.code).toBe(200);

        return nightmare
        .wait('#app > div.content > div > div > main div.markdown-viewer')
        .getInnerHtml('#app > div.content > div > div > main div.markdown-viewer')
        .then((html) => {
          expect(html).toContain('class="PieChart "');
          expect(html).toContain('class="recharts-responsive-container"');
        });
      })
      .then(() => { done(); })
      .catch(catchErrors(done));
    });
  });
});
