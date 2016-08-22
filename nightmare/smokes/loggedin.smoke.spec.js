import Nightmare from 'nightmare';
import config from '../helpers/config.js';
import {catchErrors} from 'api/utils/jasmineHelpers';

const libraryFirstDocument = '.item-group .item';
const searchInLibrary = '#app > div.content > header > div > div > div > a > i.fa.fa-search';
const firstDocumentViewButton = '#app > div.content > div > div > main > div > div.item-group > div:nth-child(1) > div.item-actions > a';
const libraryNavButton = '#app > div.content > header > div > div > ul > li:nth-child(1) > a';
const uploadsNavButton = '.fa-cloud-upload';
const settingsNavButton = '#app > div.content > header > div > div > ul > li:nth-child(3) > a';
const uploadBox = '#app > div.content > div > div > main > div:nth-child(1) > div';
const uploadsBottomRightSaveButton = '.float-btn';

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
        .wait(libraryFirstDocument)
        .exists(libraryFirstDocument)
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('when clicking on a document a side panel should appear', (done) => {
        nightmare
        .click(libraryFirstDocument)
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
        .wait('.fa-close')
        .click('.fa-close')
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
        .wait(searchInLibrary)
        .click(searchInLibrary)
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
        .wait('.fa-close')
        .click('.fa-close')
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
        .wait(firstDocumentViewButton)
        .click(firstDocumentViewButton)
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
        .wait(libraryNavButton)
        .click(libraryNavButton)
        .wait(libraryFirstDocument)
        .exists(libraryFirstDocument)
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
        .wait(uploadsNavButton)
        .click(uploadsNavButton)
        .wait(uploadBox)
        .exists(uploadBox)
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('click on a document then a side panel with the metadata form should appear', (done) => {
        nightmare
        .click(libraryFirstDocument)
        .wait(libraryFirstDocument)
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
        .wait(uploadsBottomRightSaveButton)
        .mouseover(uploadsBottomRightSaveButton)
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
        .wait(settingsNavButton)
        .click(settingsNavButton)
        .wait('input[type="email"]')
        .exists('input[type="email"]')
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
