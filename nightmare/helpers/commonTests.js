import selectors from './selectors';
import config from './config';

export function loginAsAdminAndGoToSettings(nightmare, catchErrors, done) {
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
}

export function loginAsAdminAndGoToUploads(nightmare, catchErrors, done) {
  nightmare
  .login('admin', 'admin')
  .waitToClick(selectors.navigation.uploadsNavButton)
  .wait(selectors.uploadsView.newEntityButtom)
  .url()
  .then((url) => {
    expect(url.match(`${config.url}/uploads`)).not.toBe(null);
    done();
  })
  .catch(catchErrors(done));
}
