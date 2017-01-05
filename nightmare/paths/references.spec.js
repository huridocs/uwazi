import Nightmare from 'nightmare';
import realMouse from 'nightmare-real-mouse';
import selectors from '../helpers/selectors.js';
import {catchErrors} from 'api/utils/jasmineHelpers';

realMouse(Nightmare);

let getInnerText = (selector) => {
  return document.querySelector(selector).innerText;
};

describe('references path', () => {
  let nightmare = new Nightmare({show: true, typeInterval: 10}).viewport(1100, 600);

  describe('login', () => {
    it('should log in as admin', (done) => {
      nightmare
      .login('admin', 'admin')
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
    });
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
      nightmare
      .selectText(selectors.documentView.documentPageFirstParagraph)
      .waitToClick(selectors.documentView.createParagraphLinkButton)
      .wait(selectors.documentView.createReferenceSidePanelIsActive)
      .select(selectors.documentView.createReferenceSidePanelSelect, selectors.documentView.createReferenceSidePanelSelectFirstValue)
      .type(selectors.documentView.createReferenceSidePanelInput, 'home')
      .wait(600)
      .waitToClick(selectors.documentView.createReferenceSidePanelFirstSearchSuggestion)
      .waitToClick(selectors.documentView.createReferenceSidePanelNextButton)
      .wait(selectors.documentView.targetDocument)
      .exists(selectors.documentView.targetDocument)
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should select a word from the second document then click the save button', (done) => {
      nightmare
      .wait('#pageContainer1 > div.textLayer > div:nth-child(1)')
      .scrollElement(selectors.documentView.viewer, 500)
      .selectText('#pageContainer1 > div.textLayer > div:nth-child(1)')
      .waitToClick(selectors.documentView.saveConnectionButton)
      .wait(selectors.documentView.activeConnection)
      .exists(selectors.documentView.activeConnection)
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });

    it('delete de created connection', (done) => {
      nightmare
      .mouseover(selectors.documentView.activeConnection)
      .waitToClick(selectors.documentView.unlinkIcon)
      .waitToClick('.modal-footer .btn-danger')
      .wait('.alert.alert-success')
      .exists('.alert.alert-success')
      .then((result) => {
        expect(result).toBe(true);
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
