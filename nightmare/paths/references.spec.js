import Nightmare from 'nightmare';
import realMouse from 'nightmare-real-mouse';
import config from '../helpers/config.js';
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
      .url()
      .then((url) => {
        expect(url).toBe(config.url + '/');
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
        .waitToClick(selectors.libraryView.searchInLibrary)
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
      .realClick(selectors.documentView.documentPageFirstParagraph)
      .realClick(selectors.documentView.documentPageFirstParagraph)
      .wait(selectors.documentView.bottomRightMenu)
      .mouseover(selectors.documentView.bottomRightMenu)
      .wait(selectors.documentView.bottomRightMenuIsActive)
      .realClick(selectors.documentView.bottomRightMenuAddParagraph)
      .wait(selectors.documentView.createReferenceSidePanelIsActive)
      .select(selectors.documentView.createReferenceSidePanelSelect, selectors.documentView.createReferenceSidePanelSelectFirstValue)
      .type(selectors.documentView.createReferenceSidePanelInput, '334 06 Egyptian Initiative')
      .wait(1000)
      .waitToClick(selectors.documentView.createReferenceSidePanelFirstSearchSuggestion)
      .wait(selectors.documentView.createReferenceSidePanelNextButton)
      .click(selectors.documentView.createReferenceSidePanelNextButton)
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
      .waitToClick(selectors.documentView.documentPageFirstParagraph)
      .realClick(selectors.documentView.documentPageFirstParagraph)
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
      .wait(selectors.documentView.unlinkIcon)
      .click(selectors.documentView.unlinkIcon)
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
