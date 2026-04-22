import { clearCookiesAndLogin, shareSearchTerm, grantPermission } from '../helpers/index.js';
import { clickOnCreateEntity, saveEntity } from '../helpers/entities.js';

describe('Share and permissions system (blank e2e fixtures)', () => {
  const publicOnlyUrl = 'http://localhost:3000/?q=(includeUnpublished:!f,unpublished:!f)';
  const restrictedOnlyUrl = 'http://localhost:3000/?q=(includeUnpublished:!f,unpublished:!t)';
  const publicEntityTitle = 'Blank E2E Public Entity';
  const restrictedEntityTitle = 'Blank E2E Restricted Entity';

  const waitForLibrarySearch = (url: string, alias: string) => {
    cy.intercept('GET', '/api/search*').as(alias);
    cy.visit(url);
    cy.wait(`@${alias}`).its('response.statusCode').should('be.oneOf', [200, 304]);
  };

  const openEntityInList = (title: string) => {
    cy.contains('.item-name', title, { timeout: 30000 }).click();
  };

  const createEntity = (title: string) => {
    clickOnCreateEntity();
    cy.get('#metadataForm select')
      .first()
      .then($select => {
        const firstSelectableValue = $select.find('option').eq(1).attr('value');
        if (firstSelectableValue) {
          cy.wrap($select).select(firstSelectableValue, { force: true });
        }
      });
    cy.get('textarea[name="library.sidepanel.metadata.title"]', { timeout: 30000 })
      .should('not.be.disabled')
      .type(title, { delay: 0 });
    saveEntity();
    cy.contains('.item-name', title, { timeout: 30000 }).should('be.visible');
  };

  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn blank-e2e-fixtures', { env });
    clearCookiesAndLogin('admin', 'admin');
  });

  it('should validate permissions transitions on a blank dataset', () => {
    waitForLibrarySearch(restrictedOnlyUrl, 'initialRestricted');
    cy.get('.blank-state').should('exist');
    createEntity(publicEntityTitle);
    createEntity(restrictedEntityTitle);

    waitForLibrarySearch(restrictedOnlyUrl, 'restrictedBeforePublicShare');
    openEntityInList(publicEntityTitle);
    cy.contains('button', 'Share').click();
    cy.get('[data-testid=modal] input').focus();
    cy.intercept('POST', '/api/entities/permissions').as('savePublicPermission');
    cy.contains('ul[role=listbox] span', 'Public').click();
    cy.contains('[data-testid=modal] button', 'Save changes').click();
    cy.wait('@savePublicPermission').its('response.statusCode').should('eq', 200);
    cy.get('[data-testid=modal]').should('not.exist');

    waitForLibrarySearch(publicOnlyUrl, 'publicAfterShare');
    cy.contains('.item-name', publicEntityTitle).should('be.visible');
    cy.contains('.item-name', restrictedEntityTitle).should('not.exist');

    waitForLibrarySearch(restrictedOnlyUrl, 'restrictedAfterPublicShare');
    cy.contains('.item-name', restrictedEntityTitle).should('be.visible');

    waitForLibrarySearch(restrictedOnlyUrl, 'restrictedForCollaboratorShare');
    openEntityInList(restrictedEntityTitle);
    cy.contains('button', 'Share').click();
    shareSearchTerm('PublicUser');
    grantPermission(3, 'Can see', 'write');
    cy.get('[data-testid=modal]').should('not.exist');

    waitForLibrarySearch(publicOnlyUrl, 'publicBeforeUnshare');
    openEntityInList(publicEntityTitle);
    cy.contains('button', 'Share').click();
    grantPermission(2, 'Can see', 'delete');
    cy.get('[data-testid=modal]').should('not.exist');

    waitForLibrarySearch(restrictedOnlyUrl, 'restrictedAfterUnshare');
    cy.contains('.item-name', publicEntityTitle).should('be.visible');
    cy.contains('.item-name', restrictedEntityTitle).should('be.visible');
  });
});
