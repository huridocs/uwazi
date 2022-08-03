/* eslint-disable max-lines */
/* eslint-disable max-statements */
import * as connections from '../helpers/connection-actions';
import disableTransitions from '../helpers/disableTransitions';
import insertFixtures from '../helpers/insertFixtures';
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import { sleep } from 'shared/tsUtils';

const logSelector = async (selector: string) => {
  const element = await (await (await page.$(selector))?.getProperty('outerHTML'))?.jsonValue();
  console.log(element);
};

describe('connections', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  afterAll(async () => {
    await logout();
  });

  it('should navigate to an entities connections view', async () => {
    await expect(page).toClick(
      '#filtersForm > div:nth-child(2) > ul > li > ul > li:nth-child(6) > label > span.multiselectItem-name > span'
    );
    await expect(page).toClick('.item-name', {
      text: 'Acevedo Buendia et al (Discharged and Retired Employees of the Office of the Comptroller)',
    });
    await expect(page).toClick(
      '#app > div.content > div > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-footer > span > a'
    );
    await expect(page).toMatchElement('.item-name', {
      text: 'Acevedo Buendia et al (Discharged and Retired Employees of the Office of the Comptroller)',
    });
    await expect(page).toClick('#tab-connections');
  });

  it('should remove every hub except the first one', async () => {
    await connections.clickEdit();
    await connections.removeHub(2);
    await connections.removeHub(3);
    await connections.removeHub(4);
    await connections.removeHub(5);
    await connections.clickSave();
  });

  it('should add new hub with relation group "País"', async () => {
    await connections.reloadPage();
    await connections.clickEdit();
    await connections.addHub('Court');
    await connections.addNewRelTypeToHub(2, 'País');
  });

  it('should add some countries', async () => {
    await connections.addNewConnection(2, 1, 'Bolivia');
    await connections.addNewConnection(2, 1, 'Brazil');
    await connections.addNewConnection(2, 1, 'Tracy Robinson');
    await connections.addNewConnection(2, 1, 'Chile');
    await connections.addNewConnection(2, 1, 'Colombia');
  });

  it('should add new relation group "Firmantes"', async () => {
    await connections.addNewRelTypeToHub(2, 'Firmantes');
  });

  it('should add some people to "Firmantes"', async () => {
    await connections.addNewConnection(2, 2, 'Máximo Cisneros Sánchez');
    await connections.addNewConnection(2, 2, 'Margarette May Macaulay');
  });

  it('should save the relations', async () => {
    await connections.clickSave();
  });

  it('should move the person between to countries to the correct group', async () => {
    await connections.reloadPage();
    await connections.clickEdit();
    await connections.moveRelationship(2, 1, 1, 2, 2);
    await connections.clickSave();
  });

  it('should render the relations properly after a save', async () => {
    const relations = await connections.readRelations();
    expect(relations).toEqual([
      [
        'Court',
        {
          'No Label': ['Acevedo Buendía y otros. Resolución de la CorteIDH de 28 de enero de 2015'],
        },
      ],
      [
        'Court',
        {
          País: ['Bolivia', 'Brazil', 'Chile', 'Colombia'],
          Firmantes: ['Máximo Cisneros Sánchez', 'Margarette May Macaulay', 'Tracy Robinson'],
        },
      ],
    ]);
  });

  it('should render the relations properly after a reload', async () => {
    await connections.reloadPage();
    const relations = await connections.readRelations();
    expect(relations).toEqual([
      [
        'Court',
        {
          '': ['Acevedo Buendía y otros. Resolución de la CorteIDH de 28 de enero de 2015'],
        },
      ],
      [
        'Court',
        {
          País: ['Bolivia', 'Brazil', 'Chile', 'Colombia'],
          Firmantes: ['Tracy Robinson', 'Máximo Cisneros Sánchez', 'Margarette May Macaulay'],
        },
      ],
    ]);
  });

  it('should remove Brazil and Chile, then undo the removal of Brazil', async () => {
    await connections.clickEdit();
    await connections.clickRemoveRelationship(2, 2, 2);
    await connections.clickRemoveRelationship(2, 2, 3);
    await connections.clickRemoveRelationship(2, 2, 2);
    await connections.clickSave();
    await connections.reloadPage();
    const relations = await connections.readRelations();
    expect(relations).toEqual([
      [
        'Court',
        {
          '': ['Acevedo Buendía y otros. Resolución de la CorteIDH de 28 de enero de 2015'],
        },
      ],
      [
        'Court',
        {
          País: ['Bolivia', 'Brazil', 'Colombia'],
          Firmantes: ['Tracy Robinson', 'Máximo Cisneros Sánchez', 'Margarette May Macaulay'],
        },
      ],
    ]);
  });

  it('should add new hub with relation group "Votos separados" with some entries', async () => {
    await connections.clickEdit();
    await connections.addHub('Court');
    await connections.addNewRelTypeToHub(3, 'Votos separados');
    await connections.addNewConnection(3, 1, 'Artavia Murillo et al');
    await connections.addNewConnection(3, 1, 'Anzualdo Castro');
    await connections.addNewConnection(3, 1, 'Almonacid Arellano et al');
    await connections.clickSave();
    await connections.reloadPage();
    const relations = await connections.readRelations();
    expect(relations).toEqual([
      [
        'Court',
        {
          '': ['Acevedo Buendía y otros. Resolución de la CorteIDH de 28 de enero de 2015'],
        },
      ],
      [
        'Court',
        {
          'Votos separados': [
            'Almonacid Arellano et al',
            'Anzualdo Castro',
            'Artavia Murillo et al',
          ],
        },
      ],
      [
        'Court',
        {
          País: ['Bolivia', 'Brazil', 'Colombia'],
          Firmantes: ['Tracy Robinson', 'Máximo Cisneros Sánchez', 'Margarette May Macaulay'],
        },
      ],
    ]);
  });

  it('should render properly from the side of "Anzualdo Castro"', async () => {
    await connections.clickEdit();
    await connections.goToRelation(2, 1, 2);
    await expect(page).toClick('#tab-connections');
    const relations = await connections.readRelations();
    expect(relations[2]).toEqual([
      'Votos separados',
      {
        Court: [
          'Acevedo Buendia et al (Discharged and Retired Employees of the Office of the Comptroller)',
        ],
        'Votos separados': ['Almonacid Arellano et al', 'Artavia Murillo et al'],
      },
    ]);
  });

  it('should remove the "Votos separados" group from the hub on "Anzualdo Castro"', async () => {
    await connections.clickEdit();
    await connections.clickRemoveTypeGroup(3, 2);
    await connections.clickSave();
    await connections.reloadPage();
    const relations = await connections.readRelations();
    expect(relations[2]).toEqual([
      'Votos separados',
      {
        Court: [
          'Acevedo Buendia et al (Discharged and Retired Employees of the Office of the Comptroller)',
        ],
      },
    ]);
  });

  it('should go back to the original entity and check the updated "Votos separados"', async () => {
    await connections.clickEdit();
    await connections.goToRelation(3, 1, 1);
    await expect(page).toClick('#tab-connections');
    const relations = await connections.readRelations();
    expect(relations[1]).toEqual([
      'Court',
      {
        'Votos separados': ['Anzualdo Castro'],
      },
    ]);
  });

  it('should remove "País" and "Votos separados", then undo the remove on "País"', async () => {
    await connections.clickEdit();
    await connections.clickRemoveTypeGroup(3, 2);
    await connections.clickRemoveTypeGroup(2, 1);
    await connections.clickRemoveTypeGroup(3, 2);
    await connections.clickSave();
    await connections.reloadPage();
    const relations = await connections.readRelations();
    expect(relations).toEqual([
      [
        'Court',
        {
          '': ['Acevedo Buendía y otros. Resolución de la CorteIDH de 28 de enero de 2015'],
        },
      ],
      [
        'Court',
        {
          País: ['Bolivia', 'Brazil', 'Colombia'],
          Firmantes: ['Tracy Robinson', 'Máximo Cisneros Sánchez', 'Margarette May Macaulay'],
        },
      ],
    ]);
  });
});
