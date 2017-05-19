import createNightmare from '../helpers/nightmare';
import config from '../helpers/config.js';
import {catchErrors} from 'api/utils/jasmineHelpers';
import selectors from '../helpers/selectors.js';

const nightmare = createNightmare();

describe('Smoke test,', () => {
  describe('while logged in,', () => {
    describe('login success,', () => {
      it('should redirect to library view', (done) => {
        nightmare
        .login('admin', 'admin')
        .url()
        .then((url) => {
          expect(url).toBe('http://localhost:3000/');
          done();
        })
        .catch(catchErrors(done));
      }, 10000);
    });
  });

  describe('while logged in,', () => {
    describe('library view', () => {
      it('should check if documents loaded correctly', (done) => {
        nightmare
        .wait(selectors.libraryView.libraryFirstDocument)
        .isVisible(selectors.libraryView.libraryFirstDocument)
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('when clicking on a document a side panel should appear', (done) => {
        nightmare
        .click(selectors.libraryView.libraryFirstDocument)
        .wait(selectors.libraryView.libraryMetadataPanel)
        .isVisible(selectors.libraryView.libraryMetadataPanel)
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('when clicking the side panels cross it should disappear', (done) => {
        nightmare
        .waitToClick('.closeSidepanel')
        .wait(2000)
        .isVisible(selectors.libraryView.libraryMetadataPanel)
        .then((result) => {
          expect(result).toBe(false);
          done();
        })
        .catch(catchErrors(done));
      });

      it('when clicking on a document view button the document should open', (done) => {
        nightmare
        .waitToClick(selectors.libraryView.firstDocumentViewButton)
        .wait('.page')
        .isVisible('.page')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('to return to library from a document should click on library nav button', (done) => {
        nightmare
        .waitToClick(selectors.navigation.libraryNavButton)
        .wait(selectors.libraryView.libraryFirstDocument)
        .isVisible(selectors.libraryView.libraryFirstDocument)
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
        .waitToClick(selectors.navigation.uploadsNavButton)
        .wait(selectors.uploadsView.uploadBox)
        .isVisible(selectors.uploadsView.uploadBox)
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('click on a document then a side panel with the metadata form should appear', (done) => {
        nightmare
        .waitToClick(selectors.uploadsView.firstDocument)
        .wait(selectors.uploadsView.metadataPanel)
        .isVisible(selectors.uploadsView.metadataPanel)
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
        .isVisible(selectors.uploadsView.metadataPanel)
        .then((result) => {
          expect(result).toBe(false);
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('settings view', () => {
      it('should check if user settings view loads', (done) => {
        nightmare
        .waitToClick(selectors.navigation.settingsNavButton)
        .wait(selectors.settingsView.settingsHeader)
        .url()
        .then((url) => {
          expect(url).toBe(config.url + '/settings/account');
          done();
        })
        .catch(catchErrors(done));
      });

      it('should click the Collection button and check collection settings appear', (done) => {
        nightmare
        .waitToClick(selectors.settingsView.collectionButton)
        .wait(selectors.settingsView.collectionNameForm)
        .isVisible(selectors.settingsView.collectionNameForm)
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('should click the Documents button and check documents appear', (done) => {
        nightmare
        .waitToClick(selectors.settingsView.documentsButton)
        .wait(selectors.settingsView.addNewDocument)
        .isVisible(selectors.settingsView.addNewDocument)
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('should click the edit button of the 1st decument', (done) => {
        nightmare
        .waitToClick(selectors.settingsView.firstEditButton)
        .wait(selectors.settingsView.documentsBackButton)
        .isVisible(selectors.settingsView.documentsBackButton)
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('should click the back button to go back to the list of documents', (done) => {
        nightmare
        .waitToClick(selectors.settingsView.documentsBackButton)
        .wait(selectors.settingsView.addNewDocument)
        .isVisible(selectors.settingsView.addNewDocument)
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('should click the Connections button and check connections appear', (done) => {
        nightmare
        .waitToClick(selectors.settingsView.connectionsButton)
        .wait(selectors.settingsView.addNewConnection)
        .isVisible(selectors.settingsView.addNewConnection)
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('should click the edit button of the 1st connection', (done) => {
        nightmare
        .waitToClick(selectors.settingsView.firstEditButton)
        .wait(selectors.settingsView.connectionsBackButton)
        .isVisible(selectors.settingsView.connectionsBackButton)
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('should click the back button to go back to the list of Connections', (done) => {
        nightmare
        .waitToClick(selectors.settingsView.connectionsBackButton)
        .wait(selectors.settingsView.addNewConnection)
        .isVisible(selectors.settingsView.addNewConnection)
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('should click the thesauris button and check thesauris appear', (done) => {
        nightmare
        .waitToClick(selectors.settingsView.dictionariesButton)
        .wait(selectors.settingsView.addNewDictionary)
        .isVisible(selectors.settingsView.addNewDictionary)
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('should click the edit button of the 1st connection', (done) => {
        nightmare
        .waitToClick(selectors.settingsView.firstEditButton)
        .wait(selectors.settingsView.dictionariesBackButton)
        .isVisible(selectors.settingsView.dictionariesBackButton)
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('should click the back button to go back to the list of thesauris', (done) => {
        nightmare
        .waitToClick(selectors.settingsView.dictionariesBackButton)
        .wait(selectors.settingsView.addNewDictionary)
        .isVisible(selectors.settingsView.addNewDictionary)
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('should click Entities button and check Entities appear', (done) => {
        nightmare
        .waitToClick(selectors.settingsView.entitiesButton)
        .wait(selectors.settingsView.addNewEntity)
        .isVisible(selectors.settingsView.addNewEntity)
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('should click the edit button of the 1st entity', (done) => {
        nightmare
        .waitToClick(selectors.settingsView.firstEditButton)
        .wait(selectors.settingsView.entitiesBackButton)
        .isVisible(selectors.settingsView.entitiesBackButton)
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('should click the back button to go back to the list of entities', (done) => {
        nightmare
        .waitToClick(selectors.settingsView.entitiesBackButton)
        .wait(selectors.settingsView.addNewEntity)
        .isVisible(selectors.settingsView.addNewEntity)
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('should click the account button and then click on logout button', (done) => {
        nightmare
        .waitToClick(selectors.settingsView.accountButton)
        .evaluate(function () {
          document.querySelector('.admin-content').scrollTop = 999;
        })
        .waitToClick(selectors.settingsView.logoutButton)
        .wait(selectors.libraryView.libraryFirstDocument)
        .isVisible(selectors.libraryView.libraryFirstDocument)
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
});
