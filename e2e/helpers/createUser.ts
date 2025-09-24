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
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await page.goto(`${host}/settings/users`);
  await disableTransitions();
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await page.waitForSelector('.react-tabs__tab--selected');
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await expect(page).toClick('button', { text: 'Add user' });
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await expect(page).toFill('input[name=email]', email);
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await expect(page).toFill('input[name=username]', username);
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await expect(page).toFill('input[name=password]', password);
  if (role) {
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toSelect('select.form-control', role);
  }
  if (group) {
    // @ts-expect-error TS(2304): Cannot find name 'page'.
    await expect(page).toClick('.multiselectItem-name', {
      text: group,
    });
  }
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await expect(page).toClick('button', { text: 'Save' });
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await expect(page).toClick('.alert.alert-success');
};
