import disableTransitions from './disableTransitions';
import { clearAndType } from './formActions';
import { getPropertyOfSelector } from './selectorUtils';

const reloadPage = async () => {
  await page.reload();
  await disableTransitions();
  await expect(page).toClick('#tab-relationships');
};

const clickEdit = async () => {
  const selector = 'button.edit-metadata';
  await expect(page).toClick(selector);
};

const clickSave = async () => {
  await expect(page).toClick('button.btn-success');
  await page.waitForXPath("//*[@class='alert-text' and contains(., 'Relationships saved')]");
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

const addNewRelationship = async (
  hubNumber: number,
  typeGroupNumber: number,
  searchTerm: string
) => {
  await expect(page).toClick(
    `${typeGroupSelector(hubNumber, typeGroupNumber)} button.relationships-new svg`
  );
  await clearAndType('aside.is-active div.sidepanel-body div.search-box input', searchTerm);
  await expect(page).toClick('.sidepanel-body .item-name', { text: searchTerm });
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

const readRelations = async () => {
  const rels = await Promise.all(
    (await page.$$('div.relationshipsHub')).map(async element => [
      await getPropertyOfSelector(element, '.leftRelationshipType .rw-input', 'textContent'),
      await Promise.all(
        (await element.$$('.rightRelationshipsTypeGroup')).map(async rightElement => [
          await getPropertyOfSelector(rightElement, '.rw-input', 'textContent'),
          await Promise.all(
            (await rightElement.$$('.rightRelationship')).map(async rel =>
              getPropertyOfSelector(rel, '.item-name', 'textContent')
            )
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
  addNewRelationship,
  relationSelector,
  goToRelation,
  clickRemoveRelationship,
  moveRelationship,
  readRelations,
};
