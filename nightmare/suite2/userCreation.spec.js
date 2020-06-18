// import selectors from '../helpers/selectors.js';
import createNightmare from '../helpers/nightmare';
import insertFixtures from '../helpers/insertFixtures';

const nightmare = createNightmare();

// const usersButton = '#app > div.content > div > div > div.settings-navigation > div > div:nth-child(1) > div.list-group > a:nth-child(2)';
// const addUserButton = '#app > div.content > div > div > div.settings-content > div > div.settings-footer > a';
// const saveUserButton = '#app > div.content > div > div > div.settings-content > div > form > div > div.settings-footer > button';
// const newUsername = '#app > div.content > div > div > div.settings-content > div > ul > li:nth-child(3) span';

// const usernameInput = '#username';
// const emailInput = '#email';
// const passwordInput = '#password';
// const adminCheckBox = '#admin';

describe('userCreation', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  it('should log in as admin', async () => {
    await nightmare.login('admin', 'admin');
  });

  // it('should create a new user', (done) => {
  //   nightmare.waitToClick(selectors.settingsView.settingsHeader)
  //   .waitToClick(usersButton)
  //   .waitToClick(addUserButton)
  //   .write(usernameInput, 'username')
  //   .write(emailInput, 'email@email.com')
  //   .write(passwordInput, 'password')
  //   .waitToClick(adminCheckBox)
  //   .waitToClick(saveUserButton)
  //   // .waitToClick('.alert.alert-success')
  //   .waitToClick(usersButton)
  //   .getInnerText(newUsername)
  //   .then((newUser) => {
  //     expect(newUser).toBe('username');
  //     done();
  //   });
  // });
});
