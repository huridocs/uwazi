/*global page*/

export async function adminLogin() {
  await page.goto('http://localhost:3000');
  await expect(page).toClick('a', { text: 'Sign in' });
  await expect(page).toFill('input[name=username]', 'admin');
  await expect(page).toFill('input[name=password]', 'admin');
  await expect(page).toClick('button', { text: 'Login' });
  await expect(page).toMatchElement('span', { class: 'translation', text: 'Account settings' });
}

export async function logout() {
  await page.goto('http://localhost:3000/settings/account');
  await expect(page).toClick('a', { text: 'Logout' });
  await page.waitForNavigation();
}
