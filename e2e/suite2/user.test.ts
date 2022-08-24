import insertFixtures from '../helpers/insertFixtures';
import proxyMock from '../helpers/proxyMock';
import { adminLogin, login, logout } from '../helpers/login';
import { host } from '../config';

describe('User', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await page.goto(`${host}/settings/users`);
  });

  afterAll(async () => {
    await logout();
  });

  const getListRows = async () =>
    page.$$eval('tbody tr', rows =>
      rows.map(row => {
        const tds = [...row.getElementsByTagName('td')];
        return tds.map(td => td.textContent);
      })
    );

  it('Should list all the users', async () => {
    await page.waitForSelector('tbody tr:nth-child(1)');
    const userRows = await getListRows();
    expect(userRows[0]).toEqual(['admin', 'Password', 'Admin', ' Activistas']);
    expect(userRows[1]).toEqual(['editor', 'Password', 'Editor', ' Activistas Asesores legales']);
  });

  describe('Editing user', () => {
    const assertInputValue = async (selector: string, expected: string) => {
      const fieldValue = await page.$$eval(
        selector,
        input => (<HTMLInputElement | HTMLSelectElement>input[0]).value
      );
      expect(fieldValue).toEqual(expected);
    };

    it('Should open the data of the user in a side panel', async () => {
      await expect(page).toClick('td', { text: 'admin' });
      await assertInputValue('#email_field > input', 'admin@uwazi.com');
      await assertInputValue('#role_field > select', 'admin');
      await assertInputValue('#username_field > input', 'admin');

      const groups = await page.$$eval('.multiselectItem', items =>
        items.map(item => ({
          checked: (<HTMLInputElement>item.children[0]).checked,
          groupName: item.textContent,
        }))
      );
      expect(groups.length).toBe(2);
      expect(groups[0].groupName).toEqual('Activistas');
      expect(groups[0].checked).toBe(true);
      expect(groups[1].groupName).toEqual('Asesores legales');
      expect(groups[1].checked).toBe(false);
    });

    it('Should update the name and groups of the user', async () => {
      await expect(page).toFill('#username_field > input', 'administrator');
      await expect(page).toClick('li', { text: 'Asesores legales' });
      await expect(page).toClick('button', { text: 'Save' });
      await page.waitForSelector('.side-panel', { hidden: true });
      const userRows = await getListRows();
      expect(userRows[0]).toEqual([
        'administrator',
        'Password',
        'Admin',
        ' Activistas Asesores legales',
      ]);
    });
  });

  describe('Creation of user', () => {
    it('Should create a new user', async () => {
      await expect(page).toClick('button', { text: 'Add user' });
      await expect(page).toFill('#email_field > input', 'newuser@email.test');
      await expect(page).toFill('#password_field > input', 'collaboratorPass');
      await expect(page).toFill('#username_field > input', 'collaboratorUser');
      await expect(page).toClick('li', { text: 'Asesores legales' });
      await expect(page).toClick('button', { text: 'Save' });
      await page.waitForSelector('tbody tr:nth-child(3)');
      const userRows = await getListRows();
      expect(userRows[1]).toEqual([
        'collaboratorUser',
        'Password',
        'collaborator',
        ' Asesores legales',
      ]);
    });

    it('should be able to login with new user credentials', async () => {
      await logout();
      await login('collaboratorUser', 'collaboratorPass');
    });
  });
});
