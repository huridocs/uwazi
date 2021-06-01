import { adminLogin, logout } from '../helpers/login';
import { host } from '../config';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';
import { contents } from '../helpers/entityViewPageFixtures';

describe('Entities', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  it('should create a basic page and enable it for entity view', async () => {
    await expect(page).toClick('a', { text: 'Account settings' });
    await expect(page).toClick('a', { text: 'Pages' });
    await expect(page).toClick('a', { text: 'Add page' });
    await expect(page).toFill('input[name="page.data.title"]', 'My entity view page');
    await expect(page).toFill('.tab-content > textarea', contents);
    await expect(page).toClick('.slider');
    await expect(page).toMatchElement('button', { text: 'Save' });
    await expect(page).toClick('button', { text: 'Save' });
    await expect(page).toMatch('Saved successfully.');
  });

  it('should set the template as entity view', async () => {
    await expect(page).toClick('a', { text: 'Account settings' });
    await expect(page).toClick('a', { text: 'Templates' });
    await expect(page).toClick('a', { text: 'Medida Provisional' });
    await expect(page).toClick('.slider');
    await expect(page).toSelect('select.form-control', 'My entity view page');
    await expect(page).toMatchElement('button', { text: 'Save' });
    await expect(page).toClick('button', { text: 'Save' });
    await expect(page).toMatch('Saved successfully.');
  });

  describe('display the entity in custom page', () => {
    beforeAll(async () => {
      await page.goto(`${host}`);
      await page.reload();
      await expect(page).toClick(
        'div.item-document:nth-child(3) > div:nth-child(3) > div:nth-child(2)'
      );
    });
    it('should display with raw values', async () => {
      await expect(page).toMatchElement('h1', {
        text: 'My entity view',
      });
      await expect(page).toMatchElement('.custom-title', {
        text: 'Artavia Murillo y otros',
      });
      await expect(page).toMatchElement('.custom-list', {
        text: 'Costa Rica',
      });
      await expect(page).toMatchElement('.raw-creation-date', {
        text: '1479116602198',
      });
    });

    it('should display with values from the template', async () => {
      await expect(page).toMatchElement('.envio-title', {
        text: 'Envío a la corte',
      });
    });

    it('should display with formated values', async () => {
      await expect(page).toMatchElement('.descripcion-title', {
        text: 'Resumen',
      });
      await expect(page).toMatchElement('.descriptores-title', {
        text: 'Descriptores',
      });
      await expect(page).toMatchElement('.envio-content', {
        text: 'Dec 19, 2011',
      });
      await expect(page).toMatchElement('.descripcion-content', {
        text: /(Los hechos del caso).*/g,
      });
      await expect(page).toMatchElement('.descriptores-content', {
        text: 'Derechos reproductivos',
      });
    });
  });

  afterAll(async () => {
    await logout();
  });
});
