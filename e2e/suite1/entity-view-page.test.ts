import { adminLogin, logout } from '../helpers/login';
import { host } from '../config';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';
import { contents, script } from '../helpers/entityViewPageFixtures';

describe('Entity Page view', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  it('should create a basic page and enable it for entity view', async () => {
    await expect(page).toClick('a', { text: 'Settings' });
    await expect(page).toClick('a', { text: 'Pages' });
    await expect(page).toClick('a', { text: 'Add page' });
    await expect(page).toFill('input[name="page.data.title"]', 'My entity view page');
    await expect(page).toFill('.tab-content > textarea', contents);
    await expect(page).toFill(
      '.panel-body > div:nth-child(4) > div:nth-child(3) > textarea:nth-child(1)',
      script
    );
    await expect(page).toClick('.slider');
    await expect(page).toMatchElement('button', { text: 'Save' });
    await expect(page).toClick('button', { text: 'Save' });
    await expect(page).toMatch('Saved successfully.');
  }, 60000);

  it('should set the template as entity view', async () => {
    await expect(page).toClick('a', { text: 'Settings' });
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
      await disableTransitions();
      await expect(page).toClick('.multiselectItem-name > span', {
        text: 'Medida Provisional',
      });
      await expect(page).toClick(
        'div.item-document:nth-child(2) > div:nth-child(3) > div:nth-child(2)'
      );
    });

    it('should display raw values', async () => {
      await expect(page).toMatchElement('h1', {
        text: 'My entity view',
      });
      await expect(page).toMatchElement('.custom-title', {
        text: 'Acevedo Jaramillo',
      });
      await expect(page).toMatchElement('.custom-list', {
        text: 'Peru',
      });
      await expect(page).toMatchElement('.raw-creation-date', {
        text: '1479116482780',
      });
    });

    it('should display values from the template', async () => {
      await expect(page).toMatchElement('.envio-title', {
        text: 'Envío a la corte',
      });
    });

    it('should display formated values', async () => {
      await expect(page).toMatchElement('.descripcion-title', {
        text: 'Resumen',
      });
      await expect(page).toMatchElement('.descriptores-title', {
        text: 'Descriptores',
      });
      await expect(page).toMatchElement('.envio-content', {
        text: 'Jan 15, 2004',
      });
      await expect(page).toMatchElement('.descripcion-content', {
        text: /(Los hechos del caso).*/g,
      });
      await expect(page).toMatchElement('.dynamic-values', {
        text: 'Entidad: Acevedo Jaramillo con template: Medida Provisional tiene estado Activo',
      });
      await expect(page).toMatchElement('.dynamic-values', {
        text: 'Código de estado: 35ae6c24-9f4c-4017-9f01-2bc42ff7ad83, índices: 1074124800',
      });
      await expect(page).toMatchElement('.dynamic-values', {
        text: 'Fecha de envío: Jan 15, 2004',
      });
    });

    it('should display EntityData values', async () => {
      await expect(page).toMatchElement('.EntityData-label', {
        text: 'Title',
      });
      await expect(page).toMatchElement('.EntityData-title', {
        text: 'Acevedo Jaramillo',
      });
    });

    it('should get the page datasets from the redux store directly', async () => {
      await expect(page).toMatchElement('#entity-sharedId', {
        text: 'yn70ln6v2ccba9k9',
      });
    });

    it('should have access to the page datasets in the store via the datasets var', async () => {
      await expect(page).toMatchElement('#entity-datasets-value', {
        text: 'Medida Provisional',
      });
    });
  });

  afterAll(async () => {
    await logout();
  });
});
