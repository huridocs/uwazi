/* eslint-disable max-lines */
/*eslint max-nested-callbacks: ["error", 10]*/
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import { adminLogin, logout } from '../helpers/login';
import disableTransitions from '../helpers/disableTransitions';
import { host } from '../config';

const getAllEntitiesTitles = async (number: number) => {
  await page.waitForSelector(
    `div.main-wrapper > div.item-group > div.item-document:nth-child(${number})`
  );
  return page.$$eval('div.main-wrapper > div.item-group > div.item-document', entities =>
    entities.map(entity => {
      const elem = entity.querySelector('div.item-info > h2.item-name > span');
      return elem?.textContent;
    })
  );
};

const getSearchFilters = async () =>
  page.$$eval(
    '#filtersForm > div:nth-child(5) > ul > li.wide > ul > li.multiselectItem',
    filterElems => filterElems.map(filter => filter?.getAttribute('title'))
  );

const waitForEvent = async (eventName: string, seconds: number = 2) =>
  Promise.race([
    page.evaluate(
      async (name: string) =>
        new Promise(resolve => {
          document.addEventListener(name, resolve, { once: true });
        }),
      eventName
    ),

    page.waitForTimeout(seconds * 1000),
  ]);

const selectFilterOption = async (text: string, position: number) => {
  await expect(page).toClick(
    `li.multiselectItem:nth-child(${position}) > label:nth-child(2) > span:nth-child(2) > span:nth-child(1)`,
    { text }
  );
  await waitForEvent('DOMContentLoaded');
};

describe('search filters path', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  afterAll(async () => {
    await logout();
  });

  describe('filter one type', () => {
    it('should only show entities of that type', async () => {
      await selectFilterOption('Mecanismo', 1);
      const titles = await getAllEntitiesTitles(2);
      expect(titles.length).toEqual(2);
      expect(titles[0]).toEqual('Corte Interamericana de Derechos Humanos');
      expect(titles[1]).toEqual('Comisión Interamericana de Derechos Humanos');
    });
  });

  describe('filter by more types', () => {
    it('should show entities of those types', async () => {
      await selectFilterOption('Informe de admisibilidad', 3);
      const entityTitles = await getAllEntitiesTitles(9);
      expect(entityTitles.length).toBe(9);
      expect(entityTitles).toEqual([
        'Artavia Murillo and others. Admissibility Report N° 25/04',
        'Apitz Barbera et al. Admissibility Report N° 24/05',
        'Almonacid Arellano et al. Admissibility Report N° 44/02',
        'Del Campo Dodd. Admissibility Report N° 81/01',
        'Albán Cornejo et al. Admissibility Report N° 69/02',
        'Acevedo Buendía et al. Admissibility Report N° 47/02',
        'Alvaro Lobo Pacheco et al (19 Merchants). Admissibility Report Nº 122/99',
        'Corte Interamericana de Derechos Humanos',
        'Comisión Interamericana de Derechos Humanos',
      ]);
    });
  });

  describe('multiselect filters', () => {
    it('should filter', async () => {
      await selectFilterOption('Mecanismo', 1);
      await selectFilterOption('Informe de admisibilidad', 3);
      await selectFilterOption('Ordenes de la corte', 2);
      await expect(page).toClick('span.multiselectItem-name', { text: 'Peru' });
      await waitForEvent('DOMContentLoaded');
      const entityTitles = await getAllEntitiesTitles(6);
      expect(entityTitles.length).toBe(6);
    });

    it('should filter by multiple options', async () => {
      await expect(page).toClick('span.multiselectItem-name', { text: 'Ecuador' });
      await waitForEvent('DOMContentLoaded');
      const entityTitles = await getAllEntitiesTitles(11);
      expect(entityTitles.length).toBe(11);
      expect(entityTitles).toEqual([
        'Anzualdo Castro. Order of the IACourt. August 21, 2013',
        'Albán Cornejo y otros. Resolución de la CorteIDH de 28 de agosto de 2015',
        'Alban Cornejo et al. Order of the IACourt. February 5, 2013',
        'Alban Cornejo et al. Order of the IACourt. August 27, 2010',
        'Alban Cornejo et al. Order of the IACourt. July 6, 2009',
        'Acosta Calderon. Order of the Court. February 7, 2008',
        'Acevedo Jaramillo y otros. Resolución de la CorteIDH de 28 de agosto de 2015',
        'Acevedo Jaramillo y otros. Resolución de la CorteIDH de 23 de noviembre de 2004',
        'Acevedo Buendía y otros. Resolución de la CorteIDH de 28 de enero de 2015',
        'Acevedo Buendia et al. Order of the IACourt. July 1, 2011',
        'Abrill Alosilla and al. Order of the IACourt. May 22, 2013',
      ]);
    });

    describe('AND switch', () => {
      it('should filter entities having all the values selected', async () => {
        await expect(page).toClick('span.multiselectItem-name', { text: 'Ecuador' });
        await expect(page).toClick('label[for="pa_sswitcher"].switcher');
        await waitForEvent('DOMContentLoaded');
        const entityTitles = await getAllEntitiesTitles(6);
        expect(entityTitles.length).toEqual(6);
        await expect(page).toClick('span.multiselectItem-name', { text: 'Peru' });
        await page.waitForSelector('span.multiselectItem-name');
      });
    });
  });

  describe('date filters', () => {
    const fillDate = async (selector: string, date: string) => {
      await expect(page).toClick(`div.${selector}`);
      await expect(page).toFill(`div.${selector} > div > div > input`, date);
      try {
        await page.waitForSelector('.react-datepicker__day--selected');
        await page.click('.react-datepicker__day--selected');
      } catch (_ex) {}
    };

    it('should filter by a date for Ordenes de la corte', async () => {
      await fillDate('DatePicker__From', '31/07/2015');
      await fillDate('DatePicker__To', '31/08/2022');
      await waitForEvent('DOMContentLoaded');
      const entityTitles = await getAllEntitiesTitles(3);
      expect(entityTitles.length).toEqual(3);
      expect(entityTitles).toEqual([
        'Albán Cornejo y otros. Resolución de la CorteIDH de 28 de agosto de 2015',
        'Acevedo Jaramillo y otros. Resolución de la CorteIDH de 28 de agosto de 2015',
        '19 Comerciantes. Resolucion de la CorteIDH de 23 de junio de 2016',
      ]);
    });
  });

  describe('sorting of filters', () => {
    beforeAll(async () => {
      await expect(page).toClick('.logotype > div:nth-child(1) > a:nth-child(1)', {
        text: 'Uwazi',
      });
      await waitForEvent('DOMContentLoaded');
    });
    it('should order them by aggregated value', async () => {
      await selectFilterOption('Ordenes de la corte', 2);
      await waitForEvent('DOMContentLoaded');
      const filterNames = await getSearchFilters();
      expect([filterNames[0], filterNames[1], filterNames[2]]).toEqual([
        'Colombia',
        'El Salvador',
        'Peru',
      ]);
    });

    it('should show selected filter values first', async () => {
      await expect(page).toClick('span.multiselectItem-name', { text: 'Peru' });
      const filterNames = await getSearchFilters();
      expect([filterNames[0], filterNames[1], filterNames[2]]).toEqual([
        'Peru',
        'Colombia',
        'El Salvador',
      ]);
    });

    it('should order by aggregation count despite of selected value when expanded', async () => {
      await expect(page).toClick('span.multiselectItem-name', { text: 'Peru' });
      await expect(page).toClick('span.multiselectItem-name', { text: 'Categoría A' });
      await expect(page).toClick('span.multiselectItem-name', { text: 'Categoría B' });
      const filterNames = await getSearchFilters();
      expect([filterNames[0], filterNames[1], filterNames[2]]).toEqual([
        'Colombia',
        'El Salvador',
        'Peru',
      ]);
    });
  });

  describe('default filters', () => {
    // eslint-disable-next-line max-statements
    it('should define Fecha and País as default filters', async () => {
      await page.goto(host);
      await disableTransitions();
      await expect(page).toClick('a', { text: 'Settings' });
      await expect(page).toClick('a', { text: 'Templates' });
      await expect(page).toClick('a', { text: 'Informe de admisibilidad' });

      await expect(page).toClick(
        '.metadataTemplate-list > li:nth-child(3) > div:nth-child(1) > div:nth-child(2) > button',
        { text: 'Edit' }
      );
      await expect(page).toClick('.inline-group > div:nth-child(1) > label:nth-child(1) > span', {
        text: 'Use as filter',
      });
      await expect(page).toClick('.inline-group > div:nth-child(2) > label:nth-child(1) > span', {
        text: 'Default filter',
      });

      await expect(page).toClick(
        '.metadataTemplate-list > li:nth-child(4) > div:nth-child(1) > div:nth-child(2) > button',
        { text: 'Edit' }
      );
      await expect(page).toClick('.inline-group > div:nth-child(2) > label:nth-child(1) > span', {
        text: 'Default filter',
      });

      await expect(page).toClick('.btn-success', { text: 'Save' });
      await expect(page).toClick('.alert.alert-success');
    });

    it('should check that the filter show on the library', async () => {
      await page.goto(host);
      await disableTransitions();

      await expect(page).toMatchElement(
        '#filtersForm > div:nth-child(3) > ul:nth-child(1) > li:nth-child(1) > label:nth-child(1) > span',
        { text: 'Fecha' }
      );

      await expect(page).toMatchElement(
        'div.form-group:nth-child(4) > ul:nth-child(1) > li:nth-child(1) > span',
        { text: 'País' }
      );
    });

    it('should not display the No Label option for País', async () => {
      await expect(page).toClick('li.multiselectActions:nth-child(7) > button', {
        text: '19 more',
      });

      await expect(page).toMatchElement('li.multiselectItem', { text: 'Venezuela' });
      await expect(page).not.toMatchElement('li.multiselectItem', { text: 'No Label' });
    });

    it('should display the No Label option with the correct aggregation when filtering by template', async () => {
      await expect(page).toClick(
        'li.wide:nth-child(1) > ul:nth-child(1) > li:nth-child(10) > label:nth-child(2) > span:nth-child(2) > span',
        { text: 'Juez y/o Comisionado' }
      );

      await expect(page).toMatchElement(
        'li.multiselectItem:nth-child(25) > label:nth-child(2) > span',
        { text: 'No Label' }
      );

      await expect(page).toMatchElement(
        'li.multiselectItem:nth-child(25) > .multiselectItem-results > span',
        {
          text: '15',
        }
      );
    });
  });
});
