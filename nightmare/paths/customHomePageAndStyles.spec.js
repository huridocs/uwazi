/*eslint max-len: ["error", 500], */
import { catchErrors } from 'api/utils/jasmineHelpers';
import createNightmare from '../helpers/nightmare';
import config from '../helpers/config.js';
import selectors from '../helpers/selectors.js';
import insertFixtures from '../helpers/insertFixtures';
import { loginAsAdminAndGoToSettings } from '../helpers/commonTests';

const nightmare = createNightmare();

const localSelectors = {
  pagesButton: '#app > div.content > div > div > div.settings-navigation > div > div:nth-child(1) > div.list-group > a:nth-child(5)',
  collectionButton: '.settings-navigation .panel .list-group .list-group-item:nth-child(3)',
  createNewPageButton: '#app > div.content > div > div > div.settings-content > div > div.settings-footer > a',
  pageTitleInput: '#app > div.content > div > div > div.settings-content > div > form > div.panel.panel-default > div.metadataTemplate-heading.panel-heading > div > div > input',
  pageContentsInput: '#app > div.content > div > div > div.settings-content > div > form > div.panel.panel-default > div.panel-body.page-viewer.document-viewer > div > div.tab-content.tab-content-visible > textarea',
  customHomePageRadio: '.settings-content #collectionSettingsForm .form-group:nth-child(5) .radio:nth-child(2) input[type=radio]',
  customHomePageInput: '.settings-content #collectionSettingsForm .form-group:nth-child(5) .input-group input[name="local.home_page"]',
  collectionSaveButton: '.settings-content .settings-footer .btn-success',
  customStylesButton: '.settings-content .panel-body div:nth-child(3) a:nth-child(1)',
  customStylesInput: '#custom_css',
  customStylesUpdateButton: '.settings-content .settings-footer .btn-success',
  pageViewer: '.page-viewer .main-wrapper .markdown-viewer'
};


describe('custom home page and styles path path', () => {
  const pageHTML = '<h1>Page header</h1><div class="myDiv">Contents</div>';
  const customStyles = '.myDiv { color: white; font-size: 20px; background-color: red; }';

  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  const verifyHomePage = done => nightmare
  .getInnerHtml(localSelectors.pageViewer)
  .then((html) => {
    expect(html).toBe(pageHTML);
    return nightmare.evaluate(() => {
      const helpers = document.__helpers;
      const el = helpers.querySelector('.myDiv');
      return getComputedStyle(el);
    });
  })
  .then((style) => {
    expect(style.backgroundColor).toBe('rgb(255, 0, 0)');
    expect(style.color).toBe('rgb(255, 255, 255)');
    expect(style.fontSize).toBe('20px');
    done();
  });

  describe('login', () => {
    it('should login as admin then click the settings nav button', (done) => {
      loginAsAdminAndGoToSettings(nightmare, catchErrors, done);
    });
  });

  describe('Create custom home page', () => {
    let pageUrl = '';

    it('should create page', (done) => {
      nightmare
      .waitToClick(localSelectors.pagesButton)
      .waitToClick(localSelectors.createNewPageButton)
      .write(localSelectors.pageTitleInput, 'Home page')
      .write(localSelectors.pageContentsInput, pageHTML)
      .waitToClick('button.save-template')
      .wait('div.panel-body.page-viewer.document-viewer > div.alert.alert-info:first-of-type')
      .getInnerText('div.panel-body.page-viewer.document-viewer > div.alert.alert-info:first-of-type')
      .then((text) => {
        expect(text).toContain('/page');
        expect(text).toContain('(view page)');
      })
      .then(() => { done(); })
      .catch(catchErrors(done));
    });

    it('should get page url', (done) => {
      nightmare
      .evaluate(() => document.querySelector('.page-viewer.document-viewer .alert.alert-info a').href)
      .then((link) => {
        pageUrl = link.slice(link.indexOf('/page'));
        done();
      })
      .catch(catchErrors(done));
    });

    it('should create a custom home page link', (done) => {
      nightmare
      .waitToClick(localSelectors.collectionButton)
      .waitToClick(localSelectors.customHomePageRadio)
      .clearInput(localSelectors.customHomePageInput)
      .write(localSelectors.customHomePageInput, pageUrl)
      .waitToClick(localSelectors.collectionSaveButton)
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('Create custom css', () => {
    it('should create custom css', (done) => {
      nightmare
      .waitToClick(localSelectors.collectionButton)
      .waitToClick(localSelectors.customStylesButton)
      .wait(1000)
      .write(localSelectors.customStylesInput, customStyles)
      .waitToClick(localSelectors.customStylesUpdateButton)
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('View home page', () => {
    it('should show custom page with css when reloading to home page', (done) => {
      nightmare
      .goto(config.url)
      .then((page) => {
        expect(page.code).toBe(200);
        return verifyHomePage(done);
      })
      .catch(catchErrors(done));
    });

    it('should show custom home page when navigating to home using client-side routing', (done) => {
      nightmare
      .goto(`${config.url}/library`)
      .then((page) => {
        expect(page.code).toBe(200);

        return nightmare
        .waitToClick(selectors.homeLink)
        .wait(1000)
        .then(verifyHomePage(done));
      })
      .catch(catchErrors(done));
    });

    it('should show custom home page when the user is not logged in', (done) => {
      nightmare
      .logout()
      .then(() => nightmare.goto(`${config.url}`))
      .then(() => verifyHomePage(done))
      .catch(catchErrors(done));
    });

    it('should show custom home page for logged out users when using client-side routing', (done) => {
      nightmare
      .goto(`${config.url}/library`)
      .waitToClick(selectors.homeLink)
      .wait(1000)
      .then(() => verifyHomePage(done))
      .catch(catchErrors(done));
    });
  });
});
