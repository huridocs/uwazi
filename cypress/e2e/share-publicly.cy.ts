import {
  selectPublishedEntities,
  selectRestrictedEntities,
  createUser,
  logout,
  englishLoggedInUwazi,
} from './helpers';

describe('Share Publicly', () => {
  const entityTitle =
    'Artavia Murillo y otros. Resolución del Presidente de la Corte de 6 de agosto de 2012';
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-puppeteer-fixtures', { env });
    englishLoggedInUwazi();
  });

  it('should create a colaborator in the shared User Group', () => {
    cy.get('a[aria-label="Library"]').click();
    createUser({
      username: 'colla',
      password: 'borator',
      email: 'rock@stone.com',
      group: 'Asesores legales',
    });
  });

  it('should share an entity with the collaborator', () => {
    cy.get('a[aria-label="Library"]').click();
    selectPublishedEntities();
    cy.contains('h2', entityTitle).click();
    cy.contains('button', 'Share').click();
    cy.get('[data-testid=modal] input').type('colla');
    cy.get('ul[role=listbox]').contains('span', 'colla').click();
    cy.get('div[data-testid=modal] select').eq(2).select('write');
    cy.contains('button', 'Save changes').click();
  });

  it('should unshare entities publicly', () => {
    cy.contains('h2', entityTitle).click();
    cy.contains('button', 'Share').click();
    cy.get('div[data-testid=modal] select').eq(1).select('delete');
    cy.get('div[data-testid=modal]').toMatchImageSnapshot();
    cy.contains('button', 'Save changes').click();
  });

  describe('share entities publicly', () => {
    it('should share the entity', () => {
      cy.contains('h2', entityTitle).click();
      cy.contains('button', 'Share').click();
      cy.get('[data-testid=modal] input').focus();
      cy.get('ul[role=listbox]').should('be.visible').contains('span', 'Public').click();
      cy.contains('button', 'Save changes').click();
    });

    it('should not display the entity among the restricted ones', () => {
      cy.reload();
      selectRestrictedEntities();
      cy.contains('h2', entityTitle).should('not.exist');
    });
  });

  describe('as a collaborator', () => {
    it('should not be able to unshare entities publicly', () => {
      cy.get('.only-desktop a[aria-label="Settings"]').click();
      logout();
      englishLoggedInUwazi('colla', 'borator');
      cy.contains('h2', entityTitle).click();
      cy.contains('button', 'Share').click();
      cy.get('div[data-testid=modal] select').eq(1).should('not.exist');
      cy.get('div[data-testid=modal]').toMatchImageSnapshot();
      cy.contains('button', 'Close').click();
      cy.get('aside button[aria-label="Close side panel"]').eq(1).click();
    });

    it('should create an entity', () => {
      cy.contains('button', 'Create entity').click();
      cy.get('aside textarea').type('Test title');
      cy.contains('button', 'Save').click();
      cy.contains('div.alert', 'Entity created').click();
      cy.get('aside.metadata-sidepanel.is-active').toMatchImageSnapshot();
      cy.get('aside.is-active button[aria-label="Close side panel"]').click();
    });

    it('should not be able to share the entity', () => {
      selectRestrictedEntities();
      cy.contains('h2', 'Test title').click();
      cy.contains('button', 'Share').click();
      cy.get('div[data-testid=modal] select').should('have.length', 2);
      cy.get('div[data-testid=modal]').toMatchImageSnapshot();
      cy.contains('div[data-testid=modal] button', 'Close').click();
      cy.get('aside.is-active button[aria-label="Close side panel"]').click();
    });

    it('should show mixed access', () => {
      cy.get('.only-desktop a[aria-label="Settings"]').click();
      logout();
      englishLoggedInUwazi();
      cy.contains('header a', 'Uwazi').click();
      cy.get('input[name="library.search.searchTerm"]').type('test 2016');
      cy.get('[aria-label="Search button"]').click();
      cy.get('.item-document').should('have.length', 3);
      cy.contains('button', 'Select all').click();
      cy.get('aside').should('be.visible');
      cy.get('aside button.share-btn').eq(1).click();
      cy.get('div[data-testid=modal]').toMatchImageSnapshot();
      cy.contains('div[data-testid=modal] button', 'Close').click();
    });

    it('should keep publishing status if mixed access selected', () => {
      cy.get('input[name="library.search.searchTerm"]').type('test 2016');
      cy.get('[aria-label="Search button"]').click();
      cy.get('.item-document').should('have.length', 3);
      cy.contains('button', 'Select all').click();
      cy.get('aside').should('be.visible');
      cy.get('aside button.share-btn').eq(1).click();
      cy.get('div[data-testid=modal] select').eq(1).select('read');
      cy.contains('button', 'Save changes').click();
      cy.get('.item-document').should('have.length', 3);
      cy.get('.item-document').eq(0).toMatchImageSnapshot();
    });
  });
});
