import { selectPublishedEntities, selectRestrictedEntities } from './helpers';
import { clickOnEditEntity } from './helpers/entities';
import { clearCookiesAndLogin } from './helpers/login';

describe('Share Entities', () => {
  const titleEntity1 =
    'Resolución de la Corte IDH. Supervisión de cumplimiento de Sentencia de 29 de junio de 2005';
  const titleEntity2 = 'Applicability of Article 65 of the American Convention on Human Rights';
  const titleEntity3 = 'Article 65 of the American Convention on Human Rights';
  const titleEntity4 = 'Aitken';

  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-puppeteer-fixtures', { env });
    clearCookiesAndLogin();
  });

  // eslint-disable-next-line max-statements
  it('Should list available collaborators of an entity', () => {
    selectRestrictedEntities();
    cy.contains('h2', titleEntity1).click();
    cy.contains('button', 'Share').click();

    cy.get('[data-testid=modal] input').focus();
    cy.contains('.userGroupsLookupField', 'Activistas');
    cy.contains('.userGroupsLookupField', 'Asesores legales');
    cy.contains('.userGroupsLookupField', 'Public');

    cy.contains('[data-testid=modal] button', 'Close').click();
    cy.get('[data-testid=modal]').should('not.exist');
  });

  it('Should update the permissions of an entity', () => {
    cy.contains('h2', titleEntity1).click();
    cy.contains('button', 'Share').should('be.visible').click();
    cy.get('[data-testid=modal] input').type('editor');
    cy.get('ul[role=listbox]').contains('span', 'editor').click();
    cy.get('[data-testid=modal] input').clear();
    cy.get('[data-testid=modal] input').type('Ase');
    cy.get('ul[role=listbox]').contains('span', 'Asesores legales').click();
    cy.get('div[data-testid=modal] select').eq(1).select('write');
    cy.get('[data-testid=modal]').contains('button', 'Save changes').click();
    cy.get('.alert.alert-success').click();
  });

  it('Should not keep previous entity data', () => {
    cy.get('aside.is-active button[aria-label="Close side panel"]').click();
    selectRestrictedEntities();
    cy.contains('h2', titleEntity2).click();
    cy.contains('button', 'Share').should('be.visible').click();
    cy.contains('.member-list-item', 'Administrators and Editors');
    cy.contains('[data-testid=modal] button', 'Close').click();
    cy.get('[data-testid=modal]').should('not.exist');
  });

  it('Should open the share modal for multiple selection', () => {
    cy.contains('button', 'Select all').click();
    cy.get('aside.is-active').contains('button', 'Share').should('be.visible').click();
    cy.contains('.member-list-item', 'editor');
    cy.contains('.member-list-item', 'admin');
    cy.contains('.member-list-item', 'Administrators and Editors');
    cy.contains('.member-list-item', 'Asesores legales');
    cy.contains('[data-testid=modal] button', 'Close').click();
  });

  it('should share other entities with the collaborator', () => {
    cy.contains('h2', titleEntity3).click();
    cy.get('aside.is-active').contains('button', 'Share').should('be.visible').click();
    cy.get('[data-testid=modal] input').type('colla');
    cy.get('ul[role=listbox]').contains('span', 'colla').click();
    cy.contains('div[data-testid=modal] td', 'colla').siblings().find('select').select('write');
    cy.get('[data-testid=modal]').contains('button', 'Save changes').click();
  });

  it('should share other entities with the collaborator via the group', () => {
    cy.contains('h2', titleEntity4).click();
    cy.get('aside.is-active').contains('button', 'Share').should('be.visible').click();
    cy.get('[data-testid=modal] input').type('Ase');
    cy.get('ul[role=listbox]').contains('span', 'Asesores legales').click();
    cy.contains('div[data-testid=modal] td', 'Asesores legales')
      .siblings()
      .find('select')
      .select('write');
    cy.get('[data-testid=modal]').contains('button', 'Save changes').click();
    cy.contains('Update success');
  });

  const checkCanEdit = (title: string, canEdit: boolean = true) => {
    cy.contains('h2', title).click();
    if (canEdit) {
      cy.get('aside.is-active').contains('button', 'Edit').should('exist');
    } else {
      cy.get('aside.is-active').contains('button', 'Edit').should('not.exist');
    }
  };

  it('should be able to see and edit entities as a collaborator', () => {
    cy.visit('http://localhost:3000/logout');
    clearCookiesAndLogin('colla', 'borator');
    cy.contains('Ordenes del presidente', { timeout: 100 });
    selectRestrictedEntities();
    cy.get('.item').should('have.length', 3);
    checkCanEdit(titleEntity1, false);
    checkCanEdit(titleEntity3);
    checkCanEdit(titleEntity4);
  });

  it('should be able to edit and save', () => {
    cy.contains('h2', titleEntity4).click();
    clickOnEditEntity();
    cy.contains('Edit');
    cy.get('aside.is-active textarea').eq(0).clear();
    cy.get('aside.is-active textarea').eq(0).type('Edited title');
    cy.get('aside.is-active').contains('button', 'Save').click();
    cy.get('div.alert').click();
    cy.contains('h2', 'Edited title').should('exist');
    cy.get('aside.is-active button[aria-label="Close side panel"]').click();
  });

  it('should be able to see only published entities', () => {
    selectPublishedEntities();
    cy.get('.item-document').should('have.length', 30);
    cy.get('.search-box input').type('"Resolución de la Corte IDH."', { force: true });
    cy.get('[aria-label="Search button"]').click();
    cy.contains(
      '.item-name',
      'Artavia Murillo y otros. Resolución de la Corte IDH de 31 de marzo de 2014'
    );
    cy.get('.item-document').should('have.length', 1);
  });
});
