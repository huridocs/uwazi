/*eslint max-nested-callbacks: ["error", 10]*/
import { catchErrors } from 'api/utils/jasmineHelpers';
import config from '../helpers/config.js';
import selectors from '../helpers/selectors.js';
import createNightmare from '../helpers/nightmare';

const nightmare = createNightmare();

describe('Private instance', () => {
  describe('login', () => {
    it('should log in as admin then click the settings nav button', (done) => {
      nightmare
      .login('admin', 'admin')
      .waitToClick(selectors.navigation.settingsNavButton)
      .wait(selectors.settingsView.settingsHeader)
      .url()
      .then((url) => {
        expect(url).toBe(`${config.url}/settings/account`);
        done();
      })
      .catch(catchErrors(done));
    }, 10000);
  });

  describe('Set as private', () => {
    it('should go to settings and set the instance as private', (done) => {
      nightmare
      .waitToClick(selectors.settingsView.collectionButton)
      .waitToClick(selectors.settingsView.privateInstance)
      .waitToClick(selectors.settingsView.saveCollectionButton)
      .waitToClick('.alert.alert-success')
      .then(done)
      .catch(catchErrors(done));
    });
  });

  describe('When loged out', () => {
    it('should redirect to login', (done) => {
      nightmare
      .waitToClick(selectors.settingsView.accountButton)
      .waitToClick(selectors.settingsView.logoutButton)
      .url()
      .then((url) => {
        expect(url).toBe(`${config.url}/en/login`);
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
