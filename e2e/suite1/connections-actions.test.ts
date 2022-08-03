/* eslint-disable max-lines */
/* eslint-disable max-statements */
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';
import { sleep } from 'shared/tsUtils';
import { ElementHandle } from 'puppeteer';

const logSelector = async (selector: string) => {
  const element = await (await (await page.$(selector))?.getProperty('outerHTML'))?.jsonValue();
  console.log(element);
};

const reloadPage = async () => {
  await page.reload();
  await disableTransitions();
  await expect(page).toClick('#tab-connections');
};

const clickEdit = async () => {
  const selector = 'button.edit-metadata';
  await expect(page).toClick(selector);
};

const clickSave = async () => {
  await expect(page).toClick('button.btn-success');
};

const hubSelector = (hubNumber: number | 'first' | 'last') => {
  switch (hubNumber) {
    case 'first':
      return 'div.relationships-graph div.relationshipsHub:first-child';
    case 'last':
      return 'div.relationships-graph div.relationshipsHub:last-child';
    default:
      return `div.relationships-graph div.relationshipsHub:nth-child(${hubNumber})`;
  }
};

const removeHub = async (hubNumber: number) => {
  await expect(page).toClick(
    `${hubSelector(hubNumber)} div.removeHub:first-child button.relationships-icon`
  );
};

const addHub = async (hubType: string) => {
  await expect(page).toClick(`${hubSelector('last')} div.leftRelationshipType button`);
  const hubIndex = (await page.$$('div.relationshipsHub')).length - 1;
  await expect(page).toClick(
    `${hubSelector(hubIndex)} div.leftRelationshipType div.rw-dropdown-list-input`
  );
  await page.type(`${hubSelector(hubIndex)} div.leftRelationshipType div.rw-popup input`, hubType);
  await expect(page).toClick(`${hubSelector(hubIndex)} div.leftRelationshipType div.rw-popup li`);
};

const addNewRelTypeToHub = async (hubNumber: number, relTypeName: string) => {
  await expect(page).toClick(
    `${hubSelector(hubNumber)} div.last-of-type div.rw-dropdown-list-input + span button`
  );
  await page.type(`${hubSelector(hubNumber)} div.rw-popup input`, relTypeName);
  await expect(page).toClick(
    `${hubSelector(hubNumber)} div.rightRelationshipsTypeGroup:last-child div.rw-popup li`
  );
};

const typeGroupSelector = (hubNumber: number, typeGroupNumber: number) =>
  `${hubSelector(hubNumber)} div.rightRelationshipsTypeGroup:nth-child(${typeGroupNumber})`;

const clickRemoveTypeGroup = async (hubNumber: number, typeGroupNumber: number) =>
  expect(page).toClick(
    `${typeGroupSelector(hubNumber, typeGroupNumber)} .removeRightRelationshipGroup button`
  );

const relationSelector = (hubNumber: number, typeGroupNumber: number, relationNumber: number) =>
  `${typeGroupSelector(hubNumber, typeGroupNumber)} div.rightRelationship:nth-child(${
    relationNumber + 2
  })`;

const goToRelation = async (hubNumber: number, typeGroupNumber: number, relationNumber: number) => {
  await expect(page).toClick(`${relationSelector(hubNumber, typeGroupNumber, relationNumber)} a`, {
    text: 'View',
  });
  await disableTransitions();
};

const addNewConnection = async (hubNumber: number, typeGroupNumber: number, searchTerm: string) => {
  // console.log(searchTerm);
  // await page.evaluate('window.scrollBy(0, 200);');
  // await page.screenshot({ path: `./__temp_screenshots/${searchTerm}_1.png` });
  await expect(page).toClick(
    `${typeGroupSelector(hubNumber, typeGroupNumber)} button.relationships-new`
  );
  const boxSelector = 'aside.is-active div.sidepanel-body div.search-box input';
  const input = await page.$(boxSelector);
  await input?.click({ clickCount: 3 });
  await page.type(boxSelector, searchTerm);
  // await sleep(500); // <----------------------------------------- resolve this----!!!!!
  // await logSelector(
  //   'aside.is-active div.sidepanel-body div.search-box + div div.item-group div.item:first-child'
  // );
  // await page.screenshot({ path: `./__temp_screenshots/${searchTerm}_2.png` });
  await expect(page).toClick('.sidepanel-body .item-name', { text: searchTerm });
  // console.log('complete');
};

const moveRelationship = async (
  hubNumber: number,
  typeGroupNumber: number,
  relationNumber: number,
  targetHub: number,
  targetTypeGroup: number
) => {
  await expect(page).toClick(
    `${relationSelector(hubNumber, typeGroupNumber, relationNumber)} div.moveEntity button`
  );
  await expect(page).toClick(
    `${typeGroupSelector(targetHub, targetTypeGroup)} div.insertEntities button`
  );
};

const clickRemoveRelationship = async (
  hubNumber: number,
  typeGroupNumber: number,
  relationNumber: number
) =>
  expect(page).toClick(
    `${relationSelector(hubNumber, typeGroupNumber, relationNumber)} div.removeEntity button`
  );

const getTextOfSelector = async (element: ElementHandle, selector: string) =>
  element
    .$(selector)
    .then(input => input?.getProperty('textContent'))
    .then(input => input?.jsonValue<string>());

const readRelations = async () => {
  const rels = await Promise.all(
    (
      await page.$$('div.relationshipsHub')
    ).map(async element => [
      await getTextOfSelector(element, '.leftRelationshipType .rw-input'),
      await Promise.all(
        (
          await element.$$('.rightRelationshipsTypeGroup')
        ).map(async rightElement => [
          await getTextOfSelector(rightElement, '.rw-input'),
          await Promise.all(
            (
              await rightElement.$$('.rightRelationship')
            ).map(async rel => getTextOfSelector(rel, '.item-name'))
          ),
        ])
      ),
    ])
  );
  return rels
    .filter(p => p[0])
    .map((hub: any) => [
      hub[0],
      Object.fromEntries(hub[1].filter((group: any) => group[0] !== 'New connection type')),
    ]);
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
    await clickEdit();
    await removeHub(2);
    await removeHub(3);
    await removeHub(4);
    await removeHub(5);
    await clickSave();
  });

  it('should add new hub with relation group "País"', async () => {
    await reloadPage();
    await clickEdit();
    await addHub('Court');
    await addNewRelTypeToHub(2, 'País');
  });

  it('should add some countries', async () => {
    await addNewConnection(2, 1, 'Bolivia');
    await addNewConnection(2, 1, 'Brazil');
    await addNewConnection(2, 1, 'Tracy Robinson');
    await addNewConnection(2, 1, 'Chile');
    await addNewConnection(2, 1, 'Colombia');
  });

  it('should add new relation group "Firmantes"', async () => {
    await addNewRelTypeToHub(2, 'Firmantes');
  });

  it('should add some people to "Firmantes"', async () => {
    await addNewConnection(2, 2, 'Máximo Cisneros Sánchez');
    await addNewConnection(2, 2, 'Margarette May Macaulay');
  });

  it('should save the relations', async () => {
    await clickSave();
  });

  it('should move the person between to countries to the correct group', async () => {
    await reloadPage();
    await clickEdit();
    await moveRelationship(2, 1, 1, 2, 2);
    await clickSave();
  });

  it('should render the relations properly after a save', async () => {
    const relations = await readRelations();
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
    await reloadPage();
    const relations = await readRelations();
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
    await clickEdit();
    await clickRemoveRelationship(2, 2, 2);
    await clickRemoveRelationship(2, 2, 3);
    await clickRemoveRelationship(2, 2, 2);
    await clickSave();
    await reloadPage();
    const relations = await readRelations();
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
    await clickEdit();
    await addHub('Court');
    await addNewRelTypeToHub(3, 'Votos separados');
    await addNewConnection(3, 1, 'Artavia Murillo et al');
    await addNewConnection(3, 1, 'Anzualdo Castro');
    await addNewConnection(3, 1, 'Almonacid Arellano et al');
    await clickSave();
    await reloadPage();
    const relations = await readRelations();
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
    await clickEdit();
    await goToRelation(2, 1, 2);
    await expect(page).toClick('#tab-connections');
    const relations = await readRelations();
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
    await clickEdit();
    await clickRemoveTypeGroup(3, 2);
    await clickSave();
    await reloadPage();
    const relations = await readRelations();
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
    await clickEdit();
    await goToRelation(3, 1, 1);
    await expect(page).toClick('#tab-connections');
    const relations = await readRelations();
    expect(relations[1]).toEqual([
      'Court',
      {
        'Votos separados': ['Anzualdo Castro'],
      },
    ]);
  });

  it('should remove "País" and "Votos separados", then undo the remove on "País"', async () => {
    await clickEdit();
    await clickRemoveTypeGroup(3, 2);
    await clickRemoveTypeGroup(2, 1);
    await clickRemoveTypeGroup(3, 2);
    await clickSave();
    await reloadPage();
    const relations = await readRelations();
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
