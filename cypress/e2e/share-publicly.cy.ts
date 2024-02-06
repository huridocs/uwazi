import { selectPublishedEntities, selectRestrictedEntities, clearCookiesAndLogin } from './helpers';

describe('Permisions system', () => {
  const entityTitle =
    'Artavia Murillo y otros. Resolución del Presidente de la Corte de 6 de agosto de 2012';
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-puppeteer-fixtures', { env });
    clearCookiesAndLogin();
  });

  it('should share an entity with the collaborator', () => {
    cy.contains('Ordenes del presidente');
    selectPublishedEntities();
    cy.contains('h2', entityTitle).click();
    cy.contains('button', 'Share').click();
    cy.get('[data-testid=modal] input').type('colla');
    cy.get('ul[role=listbox]').contains('span', 'colla').click();
    cy.contains('[data-testid=modal] td', 'colla').siblings().find('select').select('write');
    cy.contains('button', 'Save changes').click();
    cy.contains('Update success').as('successMessage');
    cy.get('@successMessage').should('not.exist');
  });

  describe('make entities private', () => {
    it('should unshare entities publicly', () => {
      cy.contains('h2', entityTitle).click();
      cy.contains('button', 'Share').click();
      cy.get('[data-testid=modal] select').eq(1).select('delete');
      cy.contains('button', 'Save changes').click();
      cy.contains('Update success').as('successMessage');
      cy.get('@successMessage').should('not.exist');
      cy.get('[data-testid=modal]').should('not.exist');
      cy.get('.side-panel.is-active > .sidepanel-header > .closeSidepanel').click();
    });

    it('should display the entitiy as restricted', () => {
      selectRestrictedEntities();
      cy.contains('h2', entityTitle).should('exist');
    });
  });

  describe('make entities public', () => {
    it('should share the entity', () => {
      cy.contains('h2', entityTitle).click();
      cy.contains('button', 'Share').click();
      cy.get('[data-testid=modal] input').focus();
      cy.get('ul[role=listbox]').should('be.visible').contains('span', 'Public').click();
      cy.contains('button', 'Save changes').click();
      cy.contains('Update success').as('successMessage');
      cy.get('@successMessage').should('not.exist');
      cy.get('[data-testid=modal]').should('not.exist');
      cy.get('.side-panel.is-active > .sidepanel-header > .closeSidepanel').click();
    });

    it('should display the entity as public', () => {
      selectPublishedEntities();
      cy.contains('h2', entityTitle).should('exist');
    });
  });

  describe('as a collaborator', () => {
    it('should not have a select to remove the public share', () => {
      clearCookiesAndLogin('colla', 'borator');
      cy.contains('h2', entityTitle).click();
      cy.contains('button', 'Share').click();
      cy.contains('td', 'Public');
      cy.contains('td', 'Public').siblings().should('be.empty');
      cy.contains('button', 'Close').click();
      cy.get('aside button[aria-label="Close side panel"]').eq(1).click();
    });

    it('should create an entity and check it is saved', () => {
      cy.contains('button', 'Create entity').click();
      cy.get('aside textarea').type('Test title');
      cy.contains('button', 'Save').click();
      cy.contains('Entity created').as('successMessage');
      cy.get('@successMessage').should('not.exist');
      cy.get('aside.metadata-sidepanel.is-active').toMatchImageSnapshot();
      cy.get('aside.is-active button[aria-label="Close side panel"]').click();
    });

    it('should not be able to share the entity', () => {
      selectRestrictedEntities();
      cy.contains('h2', 'Test title').click();
      cy.contains('button', 'Share').click();
      cy.contains('td', 'Public').should('not.exist');
      cy.get('[data-testid=modal] select').should('have.length', 2);
      cy.contains('[data-testid=modal] button', 'Close').click();
      cy.get('aside.is-active button[aria-label="Close side panel"]').click();
    });
  });

  describe('mixed permissions', () => {
    it('should login as admin and perform a search', () => {
      clearCookiesAndLogin('admin', 'admin');
      cy.get('input[name="library.search.searchTerm"]').type('test 2016');
      cy.get('[aria-label="Search button"]').click();
      cy.get('.item-document').should('have.length', 9);
    });

    it('should show mixed access', () => {
      cy.contains('button', 'Select all').click();
      cy.get('aside').should('be.visible');
      cy.get('aside button.share-btn').eq(1).click();
      cy.contains('[data-testid=modal] button', 'Close').click();
      cy.get('[data-testid=modal]').should('not.exist');
    });

    it('should keep publishing status with mixed access', () => {
      cy.contains('button', 'Select all').click();
      cy.get('aside').should('be.visible');
      cy.get('aside button.share-btn').eq(1).click();
      cy.get('[data-testid=modal] select').eq(1).select('read');
      cy.contains('button', 'Save changes').click();
      cy.contains('Update success').as('successMessage');
      cy.get('@successMessage').should('not.exist');
      cy.get('[data-testid=modal]').should('not.exist');
      cy.get('.item-document').should('have.length', 9);
      cy.get('.item-document').eq(0).toMatchImageSnapshot();
    });
  });
});
