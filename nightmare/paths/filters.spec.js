/*eslint max-nested-callbacks: ["error", 10]*/
import Nightmare from 'nightmare';
import realMouse from 'nightmare-real-mouse';
import config from '../helpers/config.js';
import selectors from '../helpers/selectors.js';
import {catchErrors} from 'api/utils/jasmineHelpers';

realMouse(Nightmare);

fdescribe('filters path', () => {
  let nightmare = new Nightmare({show: true, typeInterval: 10}).viewport(1100, 600);

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
    });
  });

  describe('closing browser', () => {
    it('should close the browser', (done) => {
      nightmare.end()
      .then(done);
    });
  });
});
