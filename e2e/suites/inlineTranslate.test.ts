/*global page*/

import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';
import { host } from '../config';

describe('Inline translation', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  it('Should click on inline translate', async () => {
    //activate inline translate
    await expect(page).toClick('button.inlineEdit');
    await expect(page).toMatchElement('button.inlineEdit.active');
    await expect(page).toMatchElement('span.translation', {
      text: 'Create entity',
    });
    await expect(page).toClick('span.translation', {
      text: 'Create entity',
    });

    //edit the translation
    await expect(page).toMatchElement('input#es');
    await expect(page).toFill('input#es', 'Crear entidad');
    await expect(page).toClick('button', {
      text: 'Submit',
    });

    //check the translation
    await page.goto(`${host}/es`);
    await expect(page).toMatchElement('span.translation', { text: 'Crear entidad' });
  });

  afterAll(async () => {
    await logout();
  });
});
