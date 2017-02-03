/*eslint max-nested-callbacks: ["error", 10]*/
import createNightmare from '../helpers/nightmare';
import config from '../helpers/config.js';
import selectors from '../helpers/selectors.js';
import {catchErrors} from 'api/utils/jasmineHelpers';

describe('translations path', () => {
  const nightmare = createNightmare();

  describe('login', () => {
    it('should log in as admin then click the settings nav button', (done) => {
      nightmare
      .login('admin', 'admin')
      .waitToClick(selectors.navigation.settingsNavButton)
      .wait(selectors.settingsView.settingsHeader)
      .url()
      .then((url) => {
        expect(url).toBe(config.url + '/settings/account');
        done();
      })
      .catch(catchErrors(done));
    }, 10000);
  });

  describe('Translations tests', () => {
    it('should click Translations button and then click on Test Document', (done) => {
      nightmare
      .waitToClick(selectors.settingsView.translationsButton)
      .wait(selectors.settingsView.liElementsOfSection)
      .manageItemFromList(selectors.settingsView.liElementsOfSection, 'Test Document', '.fa-language')
      .wait(selectors.settingsView.translationsSaveButton)
      .exists(selectors.settingsView.translationsSaveButton)
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should change Test Document text to Document and Documento', (done) => {
      nightmare
      .clearInput(selectors.settingsView.translationInputEn)
      .type(selectors.settingsView.translationInputEn, 'Document')
      .clearInput(selectors.settingsView.translationInputEs)
      .type(selectors.settingsView.translationInputEs, 'Documento')
      .waitToClick(selectors.settingsView.translationsSaveButton)
      .wait('.alert.alert-success')
      .exists('.alert.alert-success')
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should go to library and check the translation in spanish', (done) => {
      nightmare
      .waitToClick(selectors.navigation.libraryNavButton)
      .waitToClick(selectors.navigation.spanish)
      .wait(500)
      .getInnerText(selectors.libraryView.documentTypeFilter)
      .then((result) => {
        expect(result).toBe('Documento');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should go to library and check the translation in english', (done) => {
      nightmare
      .waitToClick(selectors.navigation.libraryNavButton)
      .waitToClick(selectors.navigation.english)
      .wait(500)
      .wait(selectors.libraryView.documentTypeFilter)
      .getInnerText(selectors.libraryView.documentTypeFilter)
      .then((result) => {
        expect(result).toBe('Document');
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
