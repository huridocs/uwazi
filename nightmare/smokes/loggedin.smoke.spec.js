import Nightmare from 'nightmare';
import config from '../helpers/config.js';
import {catchErrors} from 'api/utils/jasmineHelpers';
import selectors from '../helpers/selectors.js';

describe('Smoke test,', () => {
  let nightmare = new Nightmare({show: true, typeInterval: 10}).viewport(1100, 600);

  describe('while logged in,', () => {
    describe('login success,', () => {
      it('should redirect to library view', (done) => {
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
  });

  describe('while logged in,', () => {
    describe('library view', () => {
      it('should check if documents loaded correctly', (done) => {
        nightmare
        .wait(selectors.libraryView.libraryFirstDocument)
        .exists(selectors.libraryView.libraryFirstDocument)
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('when clicking on a document a side panel should appear', (done) => {
        nightmare
        .click(selectors.libraryView.libraryFirstDocument)
        .wait('.side-panel.is-active')
        .exists('.side-panel.is-active')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('when clicking the side panels cross it should disappear', (done) => {
        nightmare
        .waitToClick('.fa-close')
        .wait('.side-panel.is-hidden')
        .exists('.side-panel.is-hidden')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('when clicking the filters menu it should appear', (done) => {
        nightmare
        .waitToClick(selectors.libraryView.searchInLibrary)
        .wait('.side-panel.is-active')
        .exists('.side-panel.is-active')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('when clicking the filters menu cross it should disappear', (done) => {
        nightmare
        .waitToClick('.fa-close')
        .wait('.side-panel.is-hidden')
        .exists('.side-panel.is-hidden')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('when clicking on a document view button the document should open', (done) => {
        nightmare
        .waitToClick(selectors.libraryView.firstDocumentViewButton)
        .wait('.page')
        .exists('.page')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('to return to library from a document should click on library nav button', (done) => {
        nightmare
        .waitToClick(selectors.libraryView.libraryNavButton)
        .wait(selectors.libraryView.libraryFirstDocument)
        .exists(selectors.libraryView.libraryFirstDocument)
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('uploads view', () => {
      it('click on uploads nav button', (done) => {
        nightmare
        .waitToClick(selectors.uploadsView.uploadsNavButton)
        .wait(selectors.uploadsView.uploadBox)
        .exists(selectors.uploadsView.uploadBox)
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('click on a document then a side panel with the metadata form should appear', (done) => {
        nightmare
        .waitToClick(selectors.libraryView.libraryFirstDocument)
        .wait('.side-panel.is-active')
        .exists('.side-panel.is-active')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('the bottom right menu should become active on roll over', (done) => {
        nightmare
        .wait(selectors.uploadsView.uploadsBottomRightSaveButton)
        .mouseover(selectors.uploadsView.uploadsBottomRightSaveButton)
        .wait('.float-btn.active')
        .exists('.float-btn.active')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('clicking on the panel cross should close the side-panel', (done) => {
        nightmare
        .wait('.close-modal')
        .click('.close-modal')
        .wait('.side-panel.is-hidden')
        .exists('.side-panel.is-hidden')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('settings view', () => {
      // FURTHER TESTS TO BE ADDED TO COMPLITELY CHECK SETTINGS VIEW, THIS IS RELATED TO METADATA VIEW DELETED
      it('should check if user settings view loads', (done) => {
        nightmare
        .waitToClick(selectors.settingsView.settingsNavButton)
        .wait(selectors.settingsView.settingsHeader)
        .url()
        .then((url) => {
          expect(url).toBe(config.url + '/settings/account');
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
});
