import * as relationships from '../helpers/relationship-actions';
import disableTransitions from '../helpers/disableTransitions';
import insertFixtures from '../helpers/insertFixtures';
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';

describe('relationships', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  afterAll(async () => {
    await logout();
  });

  it("should navigate to an entity's relationships view", async () => {
    await expect(page).toClick('#filtersForm .multiselectItem-name', { text: 'Causa' });
    await expect(page).toClick('.item-name', {
      text: 'Acevedo Buendia et al (Discharged and Retired Employees of the Office of the Comptroller)',
    });
    await expect(page).toClick('aside.is-active .sidepanel-footer a.edit-metadata');
    await expect(page).toMatchElement('.item-name', {
      text: 'Acevedo Buendia et al (Discharged and Retired Employees of the Office of the Comptroller)',
    });
    await expect(page).toClick('#tab-relationships');
  });

  it('should remove every hub except the first one', async () => {
    await relationships.clickEdit();
    await relationships.removeHub(2);
    await relationships.removeHub(3);
    await relationships.removeHub(4);
    await relationships.removeHub(5);
    await relationships.clickSave();
  });

  it('should add new hub with relation group "País"', async () => {
    await relationships.reloadPage();
    await relationships.clickEdit();
    await relationships.addHub('Court');
    await relationships.addNewRelTypeToHub(2, 'País');
  });

  it('should add some countries', async () => {
    await relationships.addNewRelationship(2, 1, 'Bolivia');
    await relationships.addNewRelationship(2, 1, 'Brazil');
    await relationships.addNewRelationship(2, 1, 'Tracy Robinson');
    await relationships.addNewRelationship(2, 1, 'Chile');
    await relationships.addNewRelationship(2, 1, 'Colombia');
  });

  it('should add new relation group "Firmantes"', async () => {
    await relationships.addNewRelTypeToHub(2, 'Firmantes');
  });

  it('should add some people to "Firmantes"', async () => {
    await relationships.addNewRelationship(2, 2, 'Máximo Cisneros Sánchez');
    await relationships.addNewRelationship(2, 2, 'Margarette May Macaulay');
  });

  it('should save the relations', async () => {
    await relationships.clickSave();
  });

  it('should move the person from countries to the correct group', async () => {
    await relationships.reloadPage();
    await relationships.clickEdit();
    await relationships.moveRelationship(2, 1, 1, 2, 2);
    await relationships.clickSave();
  });

  it('should render the relations properly after a save', async () => {
    const relations = await relationships.readRelations();
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

  it('should render the relations properly after a reload', async () => {
    await relationships.reloadPage();
    const relations = await relationships.readRelations();
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
    await relationships.clickEdit();
    await relationships.clickRemoveRelationship(2, 2, 2);
    await relationships.clickRemoveRelationship(2, 2, 3);
    await relationships.clickRemoveRelationship(2, 2, 2);
    await relationships.clickSave();
    await relationships.reloadPage();
    const relations = await relationships.readRelations();
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
    await relationships.clickEdit();
    await relationships.addHub('Court');
    await relationships.addNewRelTypeToHub(3, 'Votos separados');
    await relationships.addNewRelationship(3, 1, 'Artavia Murillo et al');
    await relationships.addNewRelationship(3, 1, 'Anzualdo Castro');
    await relationships.addNewRelationship(3, 1, 'Almonacid Arellano et al');
    await relationships.clickSave();
    await relationships.reloadPage();
    const relations = await relationships.readRelations();
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
    await relationships.clickEdit();
    await relationships.goToRelation(2, 1, 2);
    await expect(page).toClick('#tab-relationships');
    const relations = await relationships.readRelations();
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
    await relationships.clickEdit();
    await relationships.clickRemoveTypeGroup(3, 2);
    await relationships.clickSave();
    await relationships.reloadPage();
    const relations = await relationships.readRelations();
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
    await relationships.clickEdit();
    await relationships.goToRelation(3, 1, 1);
    await expect(page).toClick('#tab-relationships');
    const relations = await relationships.readRelations();
    expect(relations[1]).toEqual([
      'Court',
      {
        'Votos separados': ['Anzualdo Castro'],
      },
    ]);
  });

  it('should remove "País" and "Votos separados", then undo the remove on "País"', async () => {
    await relationships.clickEdit();
    await relationships.clickRemoveTypeGroup(3, 2);
    await relationships.clickRemoveTypeGroup(2, 1);
    await relationships.clickRemoveTypeGroup(3, 2);
    await relationships.clickSave();
    await relationships.reloadPage();
    const relations = await relationships.readRelations();
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

  it('should handle a larger set of actions all at once', async () => {
    await relationships.clickEdit();
    await relationships.removeHub(1);
    await relationships.moveRelationship(2, 1, 1, 2, 2);
    await relationships.clickRemoveRelationship(2, 1, 1);
    await relationships.clickRemoveRelationship(2, 2, 1);
    await relationships.clickRemoveRelationship(2, 2, 2);
    await relationships.addHub('Court');
    await relationships.addHub('Court');
    await relationships.addNewRelTypeToHub(3, 'Firmantes');
    await relationships.addNewRelTypeToHub(3, 'País');
    await relationships.addNewRelTypeToHub(4, 'País');
    await relationships.addNewRelationship(3, 1, 'Manuel Banchi Gundián');
    await relationships.addNewRelationship(3, 1, 'Marco Monroy Cabra');
    await relationships.addNewRelationship(3, 2, 'Ecuador');
    await relationships.addNewRelationship(3, 2, 'Guyana');
    await relationships.addNewRelationship(3, 2, 'Paraguay');
    await relationships.addNewRelationship(4, 1, 'Suriname');
    await relationships.addNewRelationship(4, 1, 'Uruguay');
    await relationships.clickSave();
    await relationships.reloadPage();
    const relations = await relationships.readRelations();
    expect(relations).toEqual([
      [
        'Court',
        {
          País: ['Tracy Robinson', 'Colombia'],
          Firmantes: ['Margarette May Macaulay'],
        },
      ],
      [
        'Court',
        {
          Firmantes: ['Manuel Banchi Gundián', 'Marco Monroy Cabra'],
          País: ['Ecuador', 'Guyana', 'Paraguay'],
        },
      ],
      [
        'Court',
        {
          País: ['Suriname', 'Uruguay'],
        },
      ],
    ]);
  });
});
