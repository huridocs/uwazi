import createNightmare from '../helpers/nightmare';
import insertFixtures from '../helpers/insertFixtures';
import selectors from '../helpers/selectors.js';

import '../helpers/navlinksDSL.js';

const nightmare = createNightmare();

describe('navlinks', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  it('should log in as admin', async () =>
    nightmare
    .login('admin', 'admin')
    .waitToClick(selectors.navigation.settingsNavButton)
    .wait(selectors.settingsView.settingsHeader)
  );

  it('should create an item menu', async () =>
    nightmare
    .clickLink('Menu')
    .navlinks.add('label', 'url')
    .navlinks.add('label2', 'url2')
    .navlinks.save()
  );

  it('should render the menus on the header', async () => {
    const menus = await nightmare.navlinks.getMenusJSON();

    expect(menus).toEqual([
      { label: 'label', url: 'http://localhost:3000/en/url' },
      { label: 'label2', url: 'http://localhost:3000/en/url2' },
    ]);
  });

  it('should load the form with the values previously saved', async () => {
    await nightmare
    .goto('http://localhost:3000/en/settings')
    .clickLink('Menu')
    .wait('.propery-form')
    .clickLink('Edit');

    const formData = await nightmare.navlinks.getFormJSON();

    expect(formData).toEqual([
      { label: 'label', url: 'url' },
      { label: 'label2', url: 'url2' },
    ]);
  });
});
