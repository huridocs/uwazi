/*eslint max-nested-callbacks: ["error", 10], max-len: ["error", 300]*/
import selectors from '../helpers/selectors.js';
import {catchErrors} from 'api/utils/jasmineHelpers';
import createNightmare from '../helpers/nightmare';
import config from '../helpers/config.js';

const nightmare = createNightmare();

describe('Library zone', () => {
  it('should go to library', (done) => {
    nightmare
    .goto(config.url)
    .then(done)
    .catch(catchErrors(done));
  });

  it('should show text snippets when performing a text search', (done) => {
    nightmare
    .librarySearch('batman')
    .getInnerText(selectors.libraryView.libraryFirstDocumentSnippet)
    .then(snippet => {
      expect(snippet.toLowerCase()).toContain('batman');
      done();
    })
    .catch(catchErrors(done));
  });

  describe('when clicking on a snippet', () => {
    it('should open the snippets tab on the sidePanel', (done) => {
      nightmare
      .waitToClick(selectors.libraryView.libraryFirstDocumentSnippet)
      .wait(100)
      .getInnerText(selectors.libraryView.librarySidePanelFirstSnippet)
      .then(snippet => {
        expect(snippet.toLowerCase()).toContain('batman');
        return nightmare.getInnerText(selectors.libraryView.librarySidePanelSecondSnippet);
      })
      .then(snippet => {
        expect(snippet.toLowerCase()).toContain('batman');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  it('should enter a document and perform a search text', (done) => {
    nightmare
    .waitToClick(selectors.libraryView.sidePanelCloseButton)
    .clearInput(selectors.libraryView.searchInput)
    .openDocumentFromLibrary('batman')
    .waitToClick(selectors.documentView.searchTextTab)
    .write(selectors.documentView.searchTextInput, 'joker')
    .evaluate((selector) => {
      document.querySelector(selector).submit();
    }, selectors.documentView.searchTextForm)
    .wait(200)
    .getInnerText(selectors.libraryView.librarySidePanelFirstSnippet)
    .then(snippet => {
      expect(snippet.toLowerCase()).toContain('joker');
      return nightmare.getInnerText(selectors.libraryView.librarySidePanelSecondSnippet);
    })
    .then(snippet => {
      expect(snippet.toLowerCase()).toContain('joker');
      done();
    })
    .catch(catchErrors(done));
  });
});

describe('closing browser', () => {
  it('should close the browser', (done) => {
    nightmare.end()
    .then(done);
  });
});
