/*global page*/

import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';

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

  const changeLanguage = async (language: string) => {
    await expect(page).toClick('.menuNav-I18NMenu .rw-select');
    await expect(page).toClick('.rw-popup-container li span', { text: language });
    await page.waitForNavigation();
    await disableTransitions();
  };

  describe('Translations from settings', () => {
    it('should be able to translate a page', async () => {
      await expect(page).toClick('a', { text: 'Account settings' });
      await expect(page).toClick('span', { text: 'Translations' });
      await expect(page).toClick('a', { text: 'Mecanismo' });

      await expect(page).toFill(
        'input[name="translationsForm,1,contexts,10,values,Mecanismo"]',
        'Mechanism'
      );
      await expect(page).toClick('button', { text: 'Save' });
      await expect(page).toMatchElement('.alert-success');

      await changeLanguage('Português');
      await expect(page).toClick('a', { text: 'Libreria' });
      await expect(page).toClick('.multiselectItem', { text: 'Mechanism' });
      await expect(page).toMatchElement('.item-document', {
        text: 'Mechanism',
      });
    });
  });

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
      await changeLanguage('Español');
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
