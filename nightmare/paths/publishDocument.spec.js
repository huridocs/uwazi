/*eslint max-nested-callbacks: ["error", 10], max-len: ["error", 300]*/
import config from '../helpers/config.js';
import selectors from '../helpers/selectors.js';
import {catchErrors} from 'api/utils/jasmineHelpers';
import createNightmare from '../helpers/nightmare';

const nightmare = createNightmare();

selectors.doc = {
  form: {
    title: '#metadataForm > div:nth-child(1) > ul > li.wide > div > textarea',
    type: '#metadataForm > div:nth-child(2) > ul > li.wide > select',
    company: '#metadataForm > div:nth-child(4) > div:nth-child(1) > ul > li.wide > div > input',
    nemesis: '#metadataForm > div:nth-child(4) > div:nth-child(2) > ul > li.wide > select',
    superPowersSearch: '#metadataForm > div:nth-child(4) > div:nth-child(3) > ul > li.wide > ul > li:nth-child(1) > div > input',
    suporPowers: {
      regeneration: '#metadataForm > div:nth-child(4) > div:nth-child(3) > ul > li.wide > ul > li.multiselectItem > label'
    }
  },
  viewer: {
    title: '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div.view > div > div > h1',
    company: '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div.view > dl:nth-child(2) > dd',
    nemesis: '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div.view > dl:nth-child(3) > dd > a',
    superpowers: '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div.view > dl:nth-child(4) > dd > ul'
  }
};

const comicCharacter = '58ad7d240d44252fee4e61fd';

describe('PublishDocument', () => {
  // missing test for actually upload and publish a document
  describe('login', () => {
    it('should log in as admin then click the uploads nav button', (done) => {
      nightmare
      .login('admin', 'admin')
      .waitToClick(selectors.navigation.uploadsNavButton)
      .url()
      .then((url) => {
        expect(url.match(config.url + '/uploads')).not.toBe(null);
        done();
      })
      .catch(catchErrors(done));
    }, 10000);
  });

  it('should fill a document metadata and publish it', (done) => {
    nightmare
    .click(selectors.libraryView.libraryFirstDocument)
    .waitToClick(selectors.libraryView.editEntityButton)
    .clearInput(selectors.doc.form.title)
    .write(selectors.doc.form.title, 'Wolverine')
    .select(selectors.doc.form.type, comicCharacter)
    .write(selectors.doc.form.company, 'Marvel Comics')
    .select(selectors.doc.form.nemesis, '86raxe05i4uf2yb9')
    .write(selectors.doc.form.superPowersSearch, 'regen')
    .waitToClick(selectors.doc.form.suporPowers.regeneration)
    .click(selectors.libraryView.saveButton)
    .waitToClick(selectors.uploadsView.firstPublishButton)
    .waitToClick(selectors.uploadsView.acceptPublishModel)
    .wait('.alert.alert-success')
    .isVisible('.alert.alert-success')
    .then((result) => {
      expect(result).toBe(true);
      done();
    });
  });

  describe('metadata editing', () => {
    it('should log in as admin and go into the document viewer for the desired entity', (done) => {
      const title = 'Wolverine';

      nightmare
      .waitForTheEntityToBeIndexed()
      .click(selectors.navigation.libraryNavButton)
      .waitForTheEntityToBeIndexed()
      .openDocumentFromLibrary(title)
      .getInnerText(selectors.documentView.contentHeader)
      .then(headerText => {
        expect(headerText).toContain(title);
        done();
      })
      .catch(catchErrors(done));
    }, 10000);

    it('should allow changing the different template\'s properties', (done) => {
      nightmare
      .wait(selectors.documentView.sidePanelTitle)
      .editDocumentFromDocumentViewer()
      .write(selectors.doc.form.title, ' (Logan)')
      .clearInput(selectors.doc.form.company)
      .write(selectors.doc.form.company, 'Marvel')
      .select(selectors.doc.form.nemesis, '86raxe05i4uf2yb9')
      .saveFromDocumentViewer()
      .refresh()
      .wait(selectors.documentView.sidePanelTitle)
      .getInnerText(selectors.doc.viewer.title)
      .then(text => {
        expect(text).toBe('Wolverine (Logan)');
        return nightmare.getInnerText(selectors.doc.viewer.company);
      })
      .then(text => {
        expect(text).toBe('Marvel');
        return nightmare.getInnerText(selectors.doc.viewer.nemesis);
      })
      .then(text => {
        expect(text).toBe('Daneryl');
        return nightmare.getInnerText(selectors.doc.viewer.superpowers);
      })
      .then(text => {
        expect(text).toBe('regeneration');
      })
      .then(done);
    }, 20000);
  });

  it('should go to library and change the document type', (done) => {
    nightmare
    .waitForTheEntityToBeIndexed()
    .click(selectors.navigation.libraryNavButton)
    .waitToClick(selectors.libraryView.libraryFirstDocument)
    .waitToClick(selectors.libraryView.editEntityButton)
    .select(selectors.newEntity.form.type, '58ad7d240d44252fee4e6201')
    .waitToClick(selectors.libraryView.saveButton)
    .waitForTheEntityToBeIndexed()
    .refresh()
    .waitToClick(selectors.libraryView.libraryFirstDocument)
    .getInnerText(selectors.libraryView.sidePanelDocumentType)
    .then(text => {
      expect(text).toBe('Test Document');
      return nightmare
      .click(selectors.libraryView.deleteButton)
      .waitToClick(selectors.libraryView.deleteButtonConfirmation)
      .waitForTheEntityToBeIndexed()
      .then(done);
    });
  }, 10000);

  describe('closing browser', () => {
    it('should close the browser', (done) => {
      nightmare.end()
      .then(done);
    });
  });
});
