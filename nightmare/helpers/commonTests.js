import selectors from './selectors';
import config from './config';

export function loginAsAdminAndGoToSettings(nightmare, catchErrors, done) {
  nightmare
    .login('admin', 'admin')
    .waitToClick(selectors.navigation.settingsNavButton)
    .wait(selectors.settingsView.settingsHeader)
    .url()
    .then(url => {
      expect(url).toBe(`${config.url}/settings/account`);
      done();
    })
    .catch(catchErrors(done));
}

export function loginAsAdminAndViewRestrictedEntities(nightmare, catchErrors, done) {
  nightmare
    .login('admin', 'admin')
    .waitToClick(selectors.libraryView.restrictedEntitiesFilterSelector)
    .waitToClick(selectors.libraryView.publishedEntitiesFilterSelector)
    .wait(selectors.libraryView.newEntityButtom)
    .then(() => {
      done();
    })
    .catch(catchErrors(done));
}
