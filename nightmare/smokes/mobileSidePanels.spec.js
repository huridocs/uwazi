import createNightmare from '../helpers/nightmare';
import config from '../helpers/config.js';
import {catchErrors} from 'api/utils/jasmineHelpers';
import selectors from '../helpers/selectors.js';

//iphone 6 measures
const nightmare = createNightmare(376, 667);

describe('mobile somke test,', () => {
  describe('login', () => {
    it('should log in as admin then click the uploads nav button', (done) => {
      nightmare
      .login('admin', 'admin')
      .waitToClick(selectors.navigation.uploadsNavButton)
      .wait(selectors.uploadsView.newEntityButtom)
      .url()
      .then((url) => {
        expect(url.match(config.url + '/uploads')).not.toBe(null);
        done();
      })
      .catch(catchErrors(done));
    }, 10000);
  });

  describe('uploads view', () => {
    it('should show side panel when click on search button', (done) => {
      nightmare
      .goToUploads()
      .click(selectors.libraryView.searchInLibrary)
      .wait('.side-panel.is-active')
      .exists('.side-panel.is-active')
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('library view', () => {
    it('when clicking on the search button a side panel should appear', (done) => {
      nightmare
      .gotoLibrary()
      .click(selectors.libraryView.searchInLibrary)
      .wait('.side-panel.is-active')
      .exists('.side-panel.is-active')
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('Entity view', () => {
    it('should show attachments panel when clicking on attachments tab', (done) => {
      nightmare
      .gotoLibrary()
      .waitToClick('#app > div.content > header > i')
      .waitToClick(selectors.libraryView.firstEntityViewButton)
      .waitToClick(selectors.entityView.sidePanelAttachmentsTab)
      .wait(selectors.entityView.sidePanelFirstAttachmentTitle)
      .getInnerText(selectors.entityView.sidePanelFirstAttachmentTitle)
      .then(attachmentName => {
        expect(attachmentName).toBeDefined();
        done();
      })
      .catch(catchErrors(done));
    }, 40000);
  });

  describe('closing browser', () => {
    it('should close the browser', (done) => {
      nightmare.end()
      .then(done);
    });
  });
});
