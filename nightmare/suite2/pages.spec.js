/*eslint max-len: ["error", 500], */
import { catchErrors } from 'api/utils/jasmineHelpers';
import createNightmare from '../helpers/nightmare';
import insertFixtures from '../helpers/insertFixtures';
import { loginAsAdminAndGoToSettings } from '../helpers/commonTests';

const localSelectors = {
  pagesButton:
    '#app > div.content > div > div > div.settings-navigation > div > div:nth-child(1) > div.list-group > a:nth-child(5)',
  createNewPageButton:
    '#app > div.content > div > div > div.settings-content > div > div.settings-footer > a',
  pageTitleInput:
    '#app > div.content > div > div > div.settings-content > div > form > div.panel.panel-default > div.metadataTemplate-heading.panel-heading > div > div > input',
  pageContentsInput:
    '#app > div.content > div > div > div.settings-content > div > form > div.panel.panel-default > div.panel-body.page-viewer.document-viewer > div > div.tab-content-visible > textarea',
};

const nightmare = createNightmare();

describe('pages path', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  describe('login', () => {
    it('should log in as admin then click the settings nav button', done => {
      loginAsAdminAndGoToSettings(nightmare, catchErrors, done);
    });
  });

  describe('Pages', () => {
    it('should create a basic page', done => {
      nightmare
        .waitToClick(localSelectors.pagesButton)
        .waitToClick(localSelectors.createNewPageButton)
        .write(localSelectors.pageTitleInput, 'Page title')
        .write(localSelectors.pageContentsInput, 'Page contents')
        .waitToClick('form > div.settings-footer > button.save-template')
        .wait('div.panel-body.page-viewer.document-viewer > div.alert-info:nth-child(2)')

        .getInnerText('div.panel-body.page-viewer.document-viewer > div.alert-info:nth-child(2)')
        .then(text => {
          expect(text).toContain('/page');
          expect(text).toContain('(view page)');
        })
        .then(() => {
          done();
        })
        .catch(catchErrors(done));
    });

    it('should navigate to page URL', done => {
      nightmare
        .evaluate(
          () =>
            document.querySelector(
              'div.panel-body.page-viewer.document-viewer > div.alert.alert-info a'
            ).href
        )
        .then(link => nightmare.goto(link))
        .then(page => {
          expect(page.code).toBe(200);

          return nightmare
            .wait('#app > div.content > div > div > main div.markdown-viewer')
            .getInnerText('#app > div.content > div > div > main div.markdown-viewer')
            .then(text => {
              expect(text).toContain('Page contents');
            });
        })
        .then(() => {
          done();
        })
        .catch(catchErrors(done));
    });
  });
});
