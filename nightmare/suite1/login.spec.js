import createNightmare from '../helpers/nightmare';
import insertFixtures from '../helpers/insertFixtures';
import selectors from '../helpers/selectors.js';

const nightmare = createNightmare();

describe('login', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  it('should log in as admin', async () => {
    await nightmare.login('admin', 'admin');
  });

  describe('after login', () => {
    it('should not redirect to login when reloading an authorized route', async () => {
      await nightmare
      .waitToClick(selectors.navigation.settingsNavButton)
      .refresh()
      .wait('body')
      .url()
      .then((url) => {
        expect(url).toMatch('settings');
      });
    });
  });
});
