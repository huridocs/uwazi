import { host } from '../config';
import disableTransitions from './disableTransitions';

interface CreateUserType {
  username: string;
  password: string;
  email: string;
  role?: string;
  group?: string;
}

export const createUser = async ({ username, password, email, role, group }: CreateUserType) => {
  await page.goto(`${host}/settings/users`);
  await disableTransitions();
  await page.waitForSelector('.react-tabs__tab--selected');
  await expect(page).toClick('button', { text: 'Add user' });
  await expect(page).toFill('input[name=email]', email);
  await expect(page).toFill('input[name=username]', username);
  await expect(page).toFill('input[name=password]', password);
  if (role) {
    await expect(page).toSelect('select.form-control', role);
  }
  if (group) {
    await expect(page).toClick('.multiselectItem-name', {
      text: group,
    });
  }
  await expect(page).toClick('button', { text: 'Save' });
  await expect(page).toClick('.alert.alert-success');
};
