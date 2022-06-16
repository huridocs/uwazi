import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import { adminLogin, logout } from '../helpers/login';

const navLink1 = '.menuItems > ul:nth-child(1) > li:nth-child(1) > a:nth-child(1)';
const navLink2 = '.menuItems > ul:nth-child(1) > li:nth-child(2) > a:nth-child(1)';

describe('navlinks', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
  });

  it('should create an item menu', async () => {
    await expect(page).toClick('a', { text: 'Settings' });
    await expect(page).toClick('a', { text: 'Menu' });
    await expect(page).toClick('button', { text: 'Add link' });
    await expect(page).toFill('input[name="settings.navlinksData.links[0].title"]', 'NavLink1');
    await expect(page).toFill('input[name="settings.navlinksData.links[0].url"]', '/some_url1');
    await expect(page).toClick('button', { text: 'Add link' });
    await expect(page).toFill('input[name="settings.navlinksData.links[1].title"]', 'NavLink2');
    await expect(page).toFill('input[name="settings.navlinksData.links[1].url"]', '/some_url2');
    await expect(page).toClick('button', { text: 'Save' });
  });

  it('should render the menus on the header', async () => {
    await expect(page).toClick('a', { text: 'Library' });
    await expect(page).toMatchElement(navLink1, { text: 'NavLink1' });
    await expect(page).toMatchElement(navLink2, { text: 'NavLink2' });

    const href1 = await page.$eval(navLink1, a => a.getAttribute('href'));
    const href2 = await page.$eval(navLink2, a => a.getAttribute('href'));
    expect(href1).toBe('/en/some_url1');
    expect(href2).toBe('/en/some_url2');
  });

  it('should load the form with the values previously saved', async () => {
    await expect(page).toClick('a', { text: 'Settings' });
    await expect(page).toClick('a', { text: 'Menu' });
    await expect(page).toMatchElement('span', { text: 'NavLink1' });
    await expect(page).toMatchElement('span', { text: 'NavLink2' });
  });

  afterAll(async () => {
    await logout();
  });
});
