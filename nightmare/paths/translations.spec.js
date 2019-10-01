/*eslint max-nested-callbacks: ["error", 10]*/
import { catchErrors } from 'api/utils/jasmineHelpers';
import createNightmare from '../helpers/nightmare';
import selectors from '../helpers/selectors.js';
import insertFixtures from '../helpers/insertFixtures';
import { loginAsAdminAndGoToSettings } from '../helpers/commonTests';

const nightmare = createNightmare();

describe('translations path', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  describe('login', () => {
    it('should log in as admin then click the settings nav button', (done) => {
      loginAsAdminAndGoToSettings(nightmare, catchErrors, done);
    });
  });

  describe('Translations tests', () => {
    it('should click Translations button and then click on Test Document', (done) => {
      nightmare
      .waitToClick(selectors.settingsView.translationsButton)
      .wait(selectors.settingsView.liElementsOfSection)
      .manageItemFromList(selectors.settingsView.liElementsOfSection, 'Test Document', '.btn-default')
      .wait(selectors.settingsView.translationsSaveButton)
      .isVisible(selectors.settingsView.translationsSaveButton)
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should change Test Document text to Document and Documento', (done) => {
      nightmare
      .clearInput(selectors.settingsView.translationInputEn)
      .write(selectors.settingsView.translationInputEn, 'Document')
      .clearInput(selectors.settingsView.translationInputEs)
      .write(selectors.settingsView.translationInputEs, 'Documento')
      .waitToClick(selectors.settingsView.translationsSaveButton)
      .waitToClick('.alert.alert-success')
      .then(() => { done(); })
      .catch(catchErrors(done));
    });

    it('should go to library and check the translation in spanish', (done) => {
      nightmare
      .waitToClick(selectors.navigation.libraryNavButton)
      .waitToClick(selectors.navigation.spanish)
      .wait(selectors.libraryView.documentTypeFilter)
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
      .wait(selectors.libraryView.documentTypeFilter)
      .wait(selectors.libraryView.documentTypeFilter)
      .getInnerText(selectors.libraryView.documentTypeFilter)
      .then((result) => {
        expect(result).toBe('Document');
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
