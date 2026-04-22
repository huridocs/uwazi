import { clearCookiesAndLogin, shareSearchTerm, grantPermission } from '../helpers/index.js';
import { clickOnEditEntity } from '../helpers/entities.js';

describe('Share and permissions system', () => {
  const titleEntity1 =
    'Resolución de la Corte IDH. Supervisión de cumplimiento de Sentencia de 29 de junio de 2005';
  const titleEntity2 = 'Applicability of Article 65 of the American Convention on Human Rights';
  const titleEntity3 = 'Article 65 of the American Convention on Human Rights';
  const titleEntity4 = 'Aitken';
  const publicEntityTitle =
    'Artavia Murillo y otros. Resolución del Presidente de la Corte de 6 de agosto de 2012';
  const publicOnlyUrl = 'http://localhost:3000/?q=(includeUnpublished:!f,unpublished:!f)';
  const restrictedOnlyUrl = 'http://localhost:3000/?q=(includeUnpublished:!f,unpublished:!t)';

  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin();
  });

  it('should list available collaborators of an entity', () => {
    cy.visit(restrictedOnlyUrl);
    cy.contains('h2', titleEntity1).click();
    cy.contains('button', 'Share').click();

    cy.get('[data-testid=modal] input').focus();
    cy.contains('.userGroupsLookupField', 'Activistas');
    cy.contains('.userGroupsLookupField', 'Asesores legales');
    cy.contains('.userGroupsLookupField', 'Public');

    cy.contains('[data-testid=modal] button', 'Close').click();
    cy.get('[data-testid=modal]').should('not.exist');
  });

  it('should update the permissions of an entity', () => {
    cy.visit(restrictedOnlyUrl);
    cy.intercept('POST', '/api/entities/permissions').as('shareEntities');
    cy.contains('h2', titleEntity1).click();
    cy.contains('button', 'Share').should('be.visible').click();
    shareSearchTerm('editor');
    shareSearchTerm('Ase', 'Asesores legales');
    cy.contains('Mixed access', { timeout: 200 }).parent().select('write');
    cy.get('[data-testid=modal]').contains('button', 'Save changes').click();
    cy.wait('@shareEntities').its('response.statusCode').should('eq', 200);
    cy.get('[data-testid=modal]').should('not.exist');
  });

  it('should not keep previous entity data', () => {
    cy.get('aside.is-active button[aria-label="Close side panel"]').click();
    cy.visit(restrictedOnlyUrl);
    cy.contains('h2', titleEntity2).click();
    cy.contains('button', 'Share').should('be.visible').click();
    cy.contains('.member-list-item', 'Administrators and Editors');
    cy.contains('[data-testid=modal] button', 'Close').click();
    cy.get('[data-testid=modal]').should('not.exist');
  });

  it('should open the share modal for multiple selection', () => {
    cy.visit(restrictedOnlyUrl);
    cy.contains('button', 'Select all').click();
    cy.get('aside.is-active').contains('button', 'Share').should('be.visible').click();
    cy.contains('.member-list-item', 'editor');
    cy.contains('.member-list-item', 'admin');
    cy.contains('.member-list-item', 'Administrators and Editors');
    cy.contains('.member-list-item', 'Asesores legales');
    cy.contains('[data-testid=modal] button', 'Close').click();
  });

  it('should share restricted entities with the collaborator', () => {
    cy.visit(restrictedOnlyUrl);
    cy.contains('h2', titleEntity3).click();
    cy.get('aside.is-active').contains('button', 'Share').should('be.visible').click();
    shareSearchTerm('colla');
    grantPermission(3, 'Can see', 'write');
  });

  it('should share restricted entities with the collaborator via a group', () => {
    cy.visit(restrictedOnlyUrl);
    cy.contains('h2', titleEntity4).click();
    cy.get('aside.is-active').contains('button', 'Share').should('be.visible').click();
    shareSearchTerm('Ase');
    grantPermission(3, 'Can see', 'write');
  });

  it('should share a public entity with the collaborator', () => {
    cy.visit(publicOnlyUrl);
    cy.contains('h2', publicEntityTitle).click();
    cy.contains('button', 'Share').click();
    shareSearchTerm('colla');
    grantPermission(4, 'Can see', 'write');
  });

  it('should unshare an entity publicly and display it as restricted', () => {
    cy.visit(publicOnlyUrl);
    cy.contains('h2', publicEntityTitle).click();
    cy.contains('button', 'Share').click();
    grantPermission(2, 'Can see', 'delete');
    cy.get('[data-testid=modal]').should('not.exist');
    cy.get('.side-panel.is-active > .sidepanel-header > .closeSidepanel').click();

    cy.visit(restrictedOnlyUrl);
    cy.contains('h2', publicEntityTitle).should('exist');
  });

  it('should share an entity publicly and display it as public', () => {
    cy.visit(restrictedOnlyUrl);
    cy.contains('h2', publicEntityTitle).click();
    cy.contains('button', 'Share').click();
    cy.get('[data-testid=modal] input').focus();
    cy.intercept('POST', '/api/entities/permissions').as('savePermissions');
    cy.get('ul[role=listbox]').should('be.visible').contains('span', 'Public').click();
    cy.contains('button', 'Save changes').click();
    cy.wait('@savePermissions');
    cy.contains('Update success');
    cy.get('[data-testid=modal]').should('not.exist');
    cy.get('.side-panel.is-active > .sidepanel-header > .closeSidepanel').click();

    cy.visit(publicOnlyUrl);
    cy.contains('h2', publicEntityTitle).should('exist');
  });

  const checkCanEdit = (title: string, canEdit: boolean = true) => {
    cy.contains('h2', title).click();
    if (canEdit) {
      cy.get('aside.is-active').contains('button', 'Edit').should('exist');
    } else {
      cy.get('aside.is-active').contains('button', 'Edit').should('not.exist');
    }
  };

  describe('as collaborator', () => {
    it('should be able to see and edit shared restricted entities', () => {
      cy.visit('http://localhost:3000/logout');
      clearCookiesAndLogin('colla', 'borator');

      cy.visit(restrictedOnlyUrl);
      cy.contains('Ordenes del presidente', { timeout: 5000 });
      cy.get('aside.library-filters').should('be.visible');
      cy.contains('CorteIDH').should('not.exist', { timeout: 5000 });
      cy.get('.item').should('have.length', 3);

      checkCanEdit(titleEntity1, false);
      checkCanEdit(titleEntity3);
      checkCanEdit(titleEntity4);
    });

    it('should be able to edit and save an allowed entity', () => {
      cy.intercept('POST', '/api/entities').as('saveEntity');
      cy.contains('h2', titleEntity4).click();
      clickOnEditEntity();
      cy.contains('Edit');
      cy.get('.sidepanel-body.scrollable').scrollTo('top');
      cy.get('[name="library.sidepanel.metadata.title"]').focus();
      cy.clearAndType('[name="library.sidepanel.metadata.title"]', 'Edited title', {
        delay: 0,
      });
      cy.get('aside.is-active').contains('button', 'Save').click();
      cy.wait('@saveEntity').its('response.statusCode').should('eq', 200);
      cy.contains('h2', 'Edited title').should('exist');
    });

    it('should not have a select to remove the public share', () => {
      cy.visit(publicOnlyUrl);
      cy.contains('h2', publicEntityTitle).click();
      cy.contains('button', 'Share').click();
      cy.contains('td', 'Public');
      cy.contains('td', 'Public').siblings().should('be.empty');
      cy.contains('button', 'Close').click();
      cy.get('aside button[aria-label="Close side panel"]').eq(1).click();
    });

    it('should create an entity and keep permissions constrained', () => {
      cy.intercept('POST', 'api/entities').as('entitySave');
      cy.contains('button', 'Create entity').click();
      cy.get('aside textarea').type('Test title');
      cy.contains('button', 'Save').click();
      cy.wait('@entitySave');
      cy.get('aside.metadata-sidepanel.is-active').should('contain', 'Test title');
      cy.get('aside.is-active button[aria-label="Close side panel"]').click();

      cy.contains('h2', 'Test title').click();
      cy.contains('button', 'Share').click();
      cy.contains('td', 'Public').should('not.exist');
      cy.get('[data-testid=modal] select').should('have.length', 2);
      cy.contains('[data-testid=modal] button', 'Close').click();
      cy.get('aside.is-active button[aria-label="Close side panel"]').click();
    });
  });

  describe('mixed permissions', () => {
    it('should show mixed access and keep publishing status', () => {
      clearCookiesAndLogin('admin', 'admin');
      cy.get('.search-box input').type('test 2016', { delay: 0 });
      cy.get('[aria-label="Search button"]').click();
      cy.get('.item-document').should('have.length.at.least', 9).should('have.length.at.most', 10);

      cy.contains('button', 'Select all').click();
      cy.get('aside').should('be.visible');
      cy.get('aside button.share-btn').eq(1).click();
      cy.get('[data-testid=modal] select').eq(1).select('read');
      cy.contains('button', 'Save changes').click();
      cy.contains('Update success').as('successMessage');
      cy.get('@successMessage').should('exist');
      cy.get('[data-testid=modal]').should('not.exist');
      cy.get('.item-document').should('have.length.at.least', 9).should('have.length.at.most', 10);
      cy.get('.item-document').eq(0).find('.item-name').should('exist');
    });
  });

  it('should be able to see only published entities', () => {
    clearCookiesAndLogin('admin', 'admin');
    cy.visit(publicOnlyUrl);
    cy.get('.item-document').should('have.length', 30);
    cy.get('.search-box input').type('"Resolución de la Corte IDH."');
    cy.get('[aria-label="Search button"]').click();
    cy.contains(
      '.item-name',
      'Artavia Murillo y otros. Resolución de la Corte IDH de 31 de marzo de 2014'
    );
    cy.get('.item-document').should('have.length', 1);
  });
});
