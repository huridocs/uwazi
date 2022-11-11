/*global page*/
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import { scrollTo } from '../helpers/formActions';
import { changeLanguage } from '../helpers/changeLanguage';

describe('Translations', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
  });

  const activateTranslation = async () => {
    await expect(page).toClick('.menuNav-I18NMenu');
    await expect(page).toClick('.live-translate');
    await expect(page).toMatchElement('.live-on');
  };

  const checkLanguageChange = async (
    language: string,
    libraryText: string,
    translation: string
  ) => {
    await changeLanguage(language);
    await expect(page).toClick('a', { text: libraryText });
    await expect(page).toMatchElement('.multiselectItem', { text: translation });
  };

  describe('Translations from settings', () => {
    it('should translate a text from settings', async () => {
      await expect(page).toClick('a', { text: 'Settings' });
      await expect(page).toClick('span', { text: 'Translations' });
      await expect(page).toClick('a', { text: 'Mecanismo' });

      await expect(page).toFill('textarea[name="formData.0.values.1.value"]', 'Mecânica');
      await expect(page).toClick('button', { text: 'Save' });
      await expect(page).toMatchElement('.alert-success');

      await checkLanguageChange('English', 'Library', 'Mecanismo');
      await checkLanguageChange('Português', 'Libreria', 'Mecânica');
    });
  });

  describe('Live translate', () => {
    const translateESInline = async (
      selector: string,
      currentText: string,
      translation: string
    ) => {
      await expect(page).toClick(selector, { text: currentText });
      await page.waitForSelector('#es');
      await expect(page).toFill('#es', translation);
      await expect(page).toClick('.confirm-button');
    };

    it('Should active live translate', async () => {
      await activateTranslation();
    });
    it('should translate a text', async () => {
      await translateESInline('.translation', 'Filters', 'Filtros');
      await expect(page).toMatchElement('.alert-success');
    });

    it('should check the translated text', async () => {
      await expect(page).toClick('.singleItem');
      await changeLanguage('Español');
      await expect(page).toMatchElement('.translation', { text: 'Filtros' });
    });

    it('should keep all side panel content visible after translation, including last button', async () => {
      await expect(page).toClick('.item-document:nth-child(1)');
      await activateTranslation();
      await translateESInline('.btn-label>.translation', 'View', 'Visualizar entidad en pantalla');
      await translateESInline(
        '.btn-label>.translation',
        'Share',
        'Abrir menu secundario para compartir'
      );

      await expect(page).toClick('.singleItem');
      await expect(page).toClick('.item-document:nth-child(1)');
      await page.waitForSelector('.attachments-list-parent');
      await scrollTo('.attachments-list-parent');
      await expect(page).toClick('.attachments-modal-trigger');
      await expect(page).toClick('button', { text: 'Cancel' });
    });

    it('should deactive live translate', async () => {
      await activateTranslation();
      await expect(page).toClick('.singleItem');
      await expect(page).not.toMatchElement('Live translate');
    });
  });
  afterAll(async () => {
    await logout();
  });
});
