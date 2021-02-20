/*eslint max-nested-callbacks: ["error", 10], max-len: ["error", 300]*/
import { catchErrors } from 'api/utils/jasmineHelpers';
import selectors from '../helpers/selectors.js';
import createNightmare from '../helpers/nightmare';
import config from '../helpers/config.js';
import insertFixtures from '../helpers/insertFixtures';

const nightmare = createNightmare();

describe('FullTextSearch zone', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  it('should go to library', done => {
    nightmare
      .goto(config.url)
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
  });

  it('should show text snippets when performing a text search', done => {
    nightmare
      .librarySearch('batman and robin')
      .wait(selectors.libraryView.libraryFirstDocumentSnippet)
      .getInnerText(selectors.libraryView.libraryFirstDocumentSnippet)
      .then(snippet => {
        expect(snippet.toLowerCase()).toContain('robin');
        done();
      })
      .catch(catchErrors(done));
  });

  describe('when clicking on a snippet', () => {
    it('should open the snippets tab on the sidePanel', done => {
      nightmare
        .waitToClick(selectors.libraryView.libraryFirstDocumentSnippet)
        .wait(200)
        .getInnerText(selectors.libraryView.librarySidePanelSnippet)
        .then(snippet => {
          expect(snippet.toLowerCase()).toContain('robin');
          return nightmare.evaluate(
            () =>
              document.querySelectorAll(
                '#app > div.content > div > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content-visible > div > ul.snippet-list > li.snippet-list-item'
              )[1].innerText
          );
        })
        .then(snippet => {
          expect(snippet.toLowerCase()).toContain('batman');
          done();
        })
        .catch(catchErrors(done));
    });
  });

  it('should enter a document and perform a search text', done => {
    nightmare
      .waitToClick(selectors.libraryView.sidePanelCloseButton)
      .clearInput(selectors.libraryView.searchInput)
      .openDocumentFromLibrary('Batman')
      .waitToClick(selectors.documentView.searchTextTab)
      .clearInput(selectors.documentView.searchTextInput)
      .write(selectors.documentView.searchTextInput, 'joker')
      .typeEnter(selectors.documentView.searchTextInput)
      .wait(2000)
      .getInnerText(selectors.documentView.viewerSidePanelFirstSnippet)
      .then(snippet => {
        expect(snippet.toLowerCase()).toContain('joker');
        return nightmare.evaluate(
          () =>
            document.querySelectorAll(
              '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content-visible > div > ul.snippet-list > li.snippet-list-item'
            )[1].innerText
        );
      })
      .then(snippet => {
        expect(snippet.toLowerCase()).toContain('joker');
        done();
      })
      .catch(catchErrors(done));
  }, 1000000);
});
