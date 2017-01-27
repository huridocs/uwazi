import createNightmare from '../helpers/nightmare';
import selectors from '../helpers/selectors.js';
import {catchErrors} from 'api/utils/jasmineHelpers';

const nightmare = createNightmare();

let getInnerText = (selector) => {
  return document.querySelector(selector).innerText;
};

describe('references path', () => {
  describe('login', () => {
    it('should log in as admin', (done) => {
      nightmare
      .login('admin', 'admin')
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
    }, 10000);
  });

  describe('search for document', () => {
    it('should find a document then open it', (done) => {
      nightmare
      .wait(selectors.libraryView.librarySecondDocumentTitle)
      .evaluate(getInnerText, selectors.libraryView.librarySecondDocumentTitle)
      .then((itemName) => {
        return nightmare
        .type(selectors.libraryView.searchInput, itemName)
        .waitToClick(selectors.libraryView.firstSearchSuggestion)
        .wait(selectors.documentView.documentPage)
        .exists(selectors.documentView.documentPage)
        .then((result) => {
          expect(result).toBe(true);
          done();
        });
      })
      .catch(catchErrors(done));
    });

    it('select a word from the document, fill the form and click the next button', (done) => {
      selectors.documentView.firstTocEntry = '#pageContainer1 > div.textLayer > div:nth-child(152)';
      selectors.documentView.secondTocEntry = '#pageContainer3 > div.textLayer > div:nth-child(11)';
      selectors.documentView.secondTocSubEntry = '#pageContainer3 > div.textLayer > div:nth-child(108)';
      selectors.documentView.secondTocSubEntry2 = '#pageContainer4 > div.textLayer > div:nth-child(20)';
      selectors.documentView.thirdTocEntry = '#pageContainer5 > div.textLayer > div:nth-child(27)';

      selectors.documentView.addToTocButton = '#app > div.content > div > div > div.ContextMenu.ContextMenu-center > div > div:nth-child(3)';
      selectors.documentView.saveTocButton = '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-footer > button';

      const doc = selectors.documentView;

      nightmare
      .scrollElement(selectors.documentView.viewer, 850)
      .selectText(doc.firstTocEntry)
      .waitToClick(doc.addToTocButton)
      .scrollElement(selectors.documentView.viewer, 2250)
      .selectText(doc.secondTocEntry)
      .waitToClick(doc.addToTocButton)
      .scrollElement(selectors.documentView.viewer, 2930)
      .selectText(doc.secondTocSubEntry)
      .waitToClick(doc.addToTocButton)
      .scrollElement(selectors.documentView.viewer, 3500)
      .selectText(doc.secondTocSubEntry2)
      .waitToClick(doc.addToTocButton)
      .scrollElement(selectors.documentView.viewer, 4700)
      .selectText(doc.thirdTocEntry)
      .waitToClick(doc.addToTocButton)
      .waitToClick(doc.saveTocButton)
      .then(() => {
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
});
