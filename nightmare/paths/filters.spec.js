/*eslint max-nested-callbacks: ["error", 10]*/
import config from '../helpers/config.js';
import selectors from '../helpers/selectors.js';
import {catchErrors} from 'api/utils/jasmineHelpers';
import createNightmare from '../helpers/nightmare';

const nightmare = createNightmare();

describe('filters path', () => {
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

  describe('Filters tests', () => {
    it('should click Filters button and then click on Create Group button', (done) => {
      nightmare
      .waitToClick(selectors.settingsView.filtersButton)
      .waitToClick(selectors.settingsView.createFilterGroupButton)
      .wait(selectors.settingsView.newFilterGroupForm)
      .isVisible(selectors.settingsView.newFilterGroupForm)
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should create a group called Test Group', (done) => {
      nightmare
      .clearInput(selectors.settingsView.newFilterGroupForm)
      .write(selectors.settingsView.newFilterGroupForm, 'Test Group')
      .waitToClick(selectors.settingsView.filtrableTypesSaveButton)
      .wait('.alert.alert-success')
      .isVisible('.alert.alert-success')
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should delete the filters group', (done) => {
      nightmare
      .deleteItemFromList(selectors.settingsView.listOfFilterGroups, 'Test Group')
      .waitToClick(selectors.settingsView.filtrableTypesSaveButton)
      .wait('.alert.alert-success')
      .isVisible('.alert.alert-success')
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
