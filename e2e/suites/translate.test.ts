/*global page*/

import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';
import { host } from '../config';

describe('Translations', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  const activateTranslation = async () => {
    await expect(page).toClick('.menuNav-I18NMenu');
    await expect(page).toClick('.live-translate');
    await expect(page).toMatchElement('.live-on');
  };

  describe('Live translate', () => {
    it('Should active live translate', async () => {
      await activateTranslation();
    });

    it('should translate a text', async () => {
      await expect(page).toClick('.translation', { text: 'Filters' });
      await expect(page).toFill('#es', 'Filtros');
      await expect(page).toClick('.confirm-button');
      await expect(page).toMatchElement('.alert-success');
    });

    it('should check the translated text', async () => {
      await expect(page).toClick('.menuNav-I18NMenu .rw-select');
      await expect(page).toClick('.rw-popup-container li span', { text: 'Español' });
      await page.waitForNavigation();
      await disableTransitions();
      await expect(page).toMatchElement('.translation', { text: 'Filtros' });
    });

    it('should deactive live translate', async () => {
      await activateTranslation();
      await expect(page).toClick('.menuNav-I18NMenu');
      await expect(page).toClick('.live-translate');
      await expect(page).toMatchElement('.live-off');
    });
  });

  afterAll(async () => {
    await logout();
  });
});

// await expect(page).toMatchElement('span.translation', {
//   text: 'Create entity',
// });
// await expect(page).toClick('span.translation', {
//   text: 'Create entity',
// });

// //edit the translation
// await expect(page).toMatchElement('input#es');
// await expect(page).toFill('input#es', 'Crear entidad');
// await expect(page).toClick('button', {
//   text: 'Submit',
// });

// //check the translation
// await page.goto(`${host}/es/library`);
// await expect(page).toMatchElement('span.translation', { text: 'Crear entidad' });

// //restore language
// await page.goto(`${host}/en/library`);
