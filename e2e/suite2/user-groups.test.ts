import insertFixtures from '../helpers/insertFixtures';
import proxyMock from '../helpers/proxyMock';
import { adminLogin, logout } from '../helpers/login';
import { host } from '../config';

describe('User groups', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await page.goto(`${host}/settings/users`);
    await expect(page).toClick('.tab-link', { text: 'Groups' });
  });

  afterAll(async () => {
    await logout();
  });

  it('Should show a list of existing groups with the count of their members', async () => {
    await expect(page).toClick('.tab-link', { text: 'Groups' });
    const groupRows = await page.$$eval('tbody tr', rows => rows.map(row => row.textContent));
    expect(groupRows).toEqual(['Activistas 2', 'Asesores legales 1']);
  });

  describe('Edition of user group', () => {
    beforeEach(async () => {
      await expect(page).toClick('td', { text: 'Asesores legales' });
    });

    it('Should open a side panel with the detail of the selected group', async () => {
      const groupName = await page.$$eval(
        '#name_field > input',
        input => (<HTMLInputElement>input[0]).value
      );
      expect(groupName).toEqual('Asesores legales');

      const users = await page.$$eval('.multiselectItem', items =>
        items.map(item => ({
          checked: (<HTMLInputElement>item.children[0]).checked,
          username: item.textContent,
        }))
      );
      expect(users[0].username).toEqual('editor');
      expect(users[0].checked).toBe(true);
      expect(users[1].username).toEqual('admin');
      expect(users[1].checked).toBe(false);
    });

    it('Should update the name and members of the group', async () => {
      await expect(page).toFill('#name_field > input', 'new name');
      await expect(page).toClick('li', { text: 'admin' });
      await expect(page).toClick('button', { text: 'Save' });
      await page.waitForSelector('.side-panel', { hidden: true });
      const groupRows = await page.$$eval('tbody tr', rows => rows.map(row => row.textContent));
      expect(groupRows).toEqual(['Activistas 2', 'new name 2']);
    });
  });

  describe('Creation of user group', () => {
    it('Should create a new user group', async () => {
      await expect(page).toClick('button', { text: 'Add group' });
      await expect(page).toFill('#name_field > input', 'New group');
      await expect(page).toClick('li', { text: 'admin' });
      await expect(page).toClick('button', { text: 'Save' });
      await page.waitForSelector('tbody tr:nth-child(3)');
      const groupRows = await page.$$eval('tbody tr', rows => rows.map(row => row.textContent));
      expect(groupRows).toEqual(['Activistas 2', 'new name 2', 'New group 1']);
    });
  });
});
