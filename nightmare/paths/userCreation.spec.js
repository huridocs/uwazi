import selectors from '../helpers/selectors.js';
import createNightmare from '../helpers/nightmare';
import insertFixtures from '../helpers/insertFixtures';

const nightmare = createNightmare();

const usersButton = '#app > div.content > div > div > div.settings-navigation > div > div:nth-child(1) > div.list-group > a:nth-child(2)';
const addUserButton = '#app > div.content > div > div > div.settings-content > div > div.settings-footer > a';
const saveUserButton = '#app > div.content > div > div > div.settings-content > div > form > div > div.settings-footer > button';
const newUsername = '#app > div.content > div > div > div.settings-content > div > ul > li:nth-child(3) span';

const usernameInput = '#username';
const emailInput = '#email';
const passwordInput = '#password';
const adminCheckBox = '#admin';

describe('userCreation', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  it('should log in as admin', async () => {
    await nightmare.login('admin', 'admin');
  });

  it('should create a new user', async () => {
    await nightmare.waitToClick(selectors.settingsView.settingsHeader);
    await nightmare.waitToClick(usersButton);
    await nightmare.waitToClick(addUserButton);
    await nightmare.write(usernameInput, 'username');
    await nightmare.write(emailInput, 'email@email.com');
    await nightmare.write(passwordInput, 'password');
    await nightmare.waitToClick(adminCheckBox);
    await nightmare.waitToClick(saveUserButton);
    await nightmare.waitToClick(usersButton);
    const newUser = await nightmare.getInnerText(newUsername);
    expect(newUser).toBe('username');
  });
});
