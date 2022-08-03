import { ElementHandle } from 'puppeteer';
import disableTransitions from '../helpers/disableTransitions';

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

const clickRemoveRelationship = async (
  hubNumber: number,
  typeGroupNumber: number,
  relationNumber: number
) =>
  expect(page).toClick(
    `${relationSelector(hubNumber, typeGroupNumber, relationNumber)} div.removeEntity button`
  );

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

export {
  reloadPage,
  clickEdit,
  clickSave,
  hubSelector,
  removeHub,
  addHub,
  addNewRelTypeToHub,
  typeGroupSelector,
  clickRemoveTypeGroup,
  addNewConnection,
  relationSelector,
  goToRelation,
  clickRemoveRelationship,
  moveRelationship,
  readRelations,
};
