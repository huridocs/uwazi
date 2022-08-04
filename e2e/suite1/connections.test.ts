/* eslint-disable max-len */
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';

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

  it('should sort the connected entitites by Fecha property', async () => {
    await expect(page).toClick('div.sort-dropdown');
    await expect(page).toClick('.rw-list-option', { text: 'Fecha' });
    await expect(page).toMatchElement(
      '#tabpanel-connections > div > div > div.relationships-graph > div > div:nth-child(1) > div.rightRelationships > div > div.rightRelationship',
      {
        text: 'Acevedo Buendía y otros. Resolución de la CorteIDH de 28 de enero de 2015',
      }
    );
    await expect(page).toMatchElement(
      '#tabpanel-connections > div > div > div.relationships-graph > div > div:nth-child(5) > div.rightRelationships > div > div.rightRelationship',
      { text: 'Peru' }
    );
  });

  it('should revert the sort order for the property Fecha', async () => {
    await expect(page).toClick(
      '#tabpanel-connections > div > div > div.sort-by.centered > div.sort-buttons > button'
    );
    await expect(page).toMatchElement(
      '#tabpanel-connections > div > div > div.relationships-graph > div > div:nth-child(1) > div.rightRelationships > div > div.rightRelationship',
      {
        text: 'Acevedo Buendía et al. Admissibility Report N° 47/02',
      }
    );
    await expect(page).toMatchElement(
      '#tabpanel-connections > div > div > div.relationships-graph > div > div:nth-child(3) > div.rightRelationships > div > div.rightRelationship',
      {
        text: 'Acevedo Buendia et al. Order of the IACourt. July 1, 2011',
      }
    );
    await expect(page).toMatchElement(
      '#tabpanel-connections > div > div > div.relationships-graph > div > div:nth-child(5) > div.rightRelationships > div > div.rightRelationship',
      { text: 'Peru' }
    );
  });

  it('should filter by search term', async () => {
    await expect(page).toFill('input[name="relationships/list/search.searchTerm"]', '2009');
    await expect(page).toMatchElement(
      '#tabpanel-connections > div > div > div.relationships-graph > div > div:nth-child(1) > div.rightRelationships > div > div.rightRelationship',
      {
        text: 'Acevedo Buendia et al. Judgment. July 1, 2009',
      }
    );
    await expect(page).not.toMatchElement(
      '#tabpanel-connections > div > div > div.relationships-graph > div > div:nth-child(2) > div.rightRelationships > div > div.rightRelationship'
    );
  });

  it('should search for "Artavia Murillo y otros" and find it', async () => {
    await expect(page).toClick('#app > div.content > header > h1.logotype > div > a', {
      text: 'Uwazi',
    });
    await expect(page).toFill('input[name="library.search.searchTerm"]', 'Artavia Murillo y otros');
    await expect(page).toClick('form > .input-group > svg[data-icon="search"]');
    await expect(page).toClick(
      '#app > div.content > div > div > div > main > div.documents-list > div > div.item-group.item-group-zoom-0 > div:nth-child(1) > div.item-actions > div > a'
    );
  });

  it('should add "Court" relationType to "Artavia Murillo y otros"', async () => {
    await expect(page).toClick('#tab-connections');
    await expect(page).toClick(
      '#app > div.content > div > div > div.sidepanel-footer > span > button'
    );
    await expect(page).toFill(
      '#rw_10_input > div.rw-widget-input.rw-widget-picker.rw-widget-container > div > input',
      'Court'
    );
  });

  it('should add an entity to the court relation type', async () => {
    await expect(page).toFill(
      '#app > div.content > div > div > aside.side-panel.create-reference.is-active > div.sidepanel-body > div.search-box > div > input',
      'leo valladares la'
    );

    await expect(page).toClick(
      '#app > div.content > div > div > aside.side-panel.create-reference.is-active > div.sidepanel-body > div:nth-child(2) > div > div:nth-child(1)'
    );

    await expect(page).toClick('.alert.alert-success');

    await expect(page).toClick(
      '#app > div.content > div > div > div.sidepanel-footer > span > button.btn.btn-success'
    );

    await expect(page).toClick('.alert.alert-success');
  });

  it('should add another entity to the court relation type', async () => {
    await expect(page).toClick(
      '#app > div.content > div > div > div.sidepanel-footer > span > button'
    );

    await page.evaluate(
      'document.querySelector("#app > div.content > div > div > main").scrollTo(0,400)'
    );

    await page.evaluate(
      'document.querySelector("#tabpanel-connections > div > div > div.relationships-graph > div > div:nth-child(2) > div.rightRelationships > div:nth-child(2) > div.rightRelationshipAdd > button").click()'
    );

    await expect(page).toFill(
      '#app > div.content > div > div > aside.side-panel.create-reference.is-active > div.sidepanel-body > div.search-box > div > input',
      'R'
    );

    await expect(page).toClick(
      '#app > div.content > div > div > aside.side-panel.create-reference.is-active > div.sidepanel-body > div:nth-child(2) > div > div:nth-child(2)'
    );

    await expect(page).toClick('.alert.alert-success');

    await expect(page).toClick(
      '#app > div.content > div > div > div.sidepanel-footer > span > button.btn.btn-success'
    );

    await expect(page).toClick('.alert.alert-success');
  });

  it('should render the relationships added after reload', async () => {
    await page.reload();
    await disableTransitions();
    await expect(page).toClick('#tab-connections');

    const entities = await page.$$(
      '#tabpanel-connections > div > div > div.relationships-graph > div > div:nth-child(2) > div.rightRelationships > div:nth-child(1) > div.rightRelationship'
    );
    expect(entities.length).toEqual(2);
  });

  it('should remove an entity from relationships that were added', async () => {
    await expect(page).toClick(
      '#app > div.content > div > div > div.sidepanel-footer > span > button'
    );

    await expect(page).toClick(
      '#tabpanel-connections > div > div > div.relationships-graph > div > div:nth-child(2) > div.rightRelationships > div:nth-child(1) > div:nth-child(3) > div.removeEntity > button'
    );
    await expect(page).toClick(
      '#app > div.content > div > div > div.sidepanel-footer > span > button.btn.btn-success'
    );
  });

  it('should render connections from "Leo Valladares Lanza" side', async () => {
    await expect(page).toClick(
      '#tabpanel-connections > div > div > div.relationships-graph > div > div:nth-child(2) > div.rightRelationships > div:nth-child(2) > div.rightRelationship > div > div > div.item-actions > div > a'
    );

    await expect(page).toMatchElement('#tabpanel-info > div');
    await expect(page).toClick('#tab-connections');

    const relationships = await page.$$(
      '#tabpanel-connections > div > div > div.relationships-graph > div > div:nth-child(2) > div.rightRelationships > div:nth-child(1) > div.rightRelationship'
    );
    expect(relationships.length).toEqual(1);
  });
});
