import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers/login';

describe('Filters', () => {
  const checkExistance = () => {
    cy.contains('Mecanismo').should('not.exist');
    cy.contains('País').should('not.exist');
    cy.contains('Ordenes de la corte').should('not.exist');
    cy.contains('Sentencia de la corte').should('not.exist');
    cy.contains('Ordenes del presidente').should('not.exist');
  };

  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin();
    cy.injectAxe();
  });

  it('should navigate to the settings screen', () => {
    cy.contains('a', 'Settings').click();
    cy.contains('a', 'Filters').click();
    cy.contains('caption', 'Filters').click();
  });

  it('should create 2 filters', () => {
    cy.contains('button', 'Add entity type').click();
    cy.contains('button', 'Mecanismo').click();
    cy.contains('button', 'País').click();
    cy.contains('button', 'Add (2)').click();
  });

  it('should create a filter group', () => {
    cy.contains('button', 'Add group').click();
    cy.get('aside').within(() => {
      cy.get('#group-name').type('My filter group 1', { delay: 0 });
      cy.getByTestId('multiselect').within(() => {
        cy.get('button').click();
        cy.contains('Ordenes de la corte').click();
        cy.contains('Ordenes del presidente').click();
        cy.contains('Sentencia de la corte').click();
      });
      cy.checkA11y();
      cy.contains('button', 'Add').click();
    });
    cy.contains('tr', 'My filter group 1').contains('button', 'Group').click();
  });

  it('should check that the table is accessible', () => {
    cy.checkA11y();
  });

  it('should not list already used tempates', () => {
    cy.contains('button', 'Add entity type').click();
    cy.get('[data-testid="modal"]').within(() => {
      checkExistance();
      cy.contains('button', 'Cancel').click();
    });

    cy.contains('button', 'Add group').click();
    cy.get('aside').within(() => {
      cy.getByTestId('multiselect').within(() => {
        cy.get('button').click();
        checkExistance();
      });
      cy.contains('button', 'Cancel').click();
    });
  });

  it('should save the filters', () => {
    cy.contains('button', 'Save').click();
    cy.contains('Filters saved');
    cy.contains('button', 'Dismiss').click();
  });

  describe('groups', () => {
    it('should edit the group', () => {
      cy.contains('tr', 'My filter group 1').contains('button', 'Edit').click();
      cy.get('aside').within(() => {
        cy.contains('Edit group');
        cy.get('#group-name').clear();
        cy.get('#group-name').type('Ordenes', { delay: 0 });
        cy.contains('button', 'Update').click();
      });
      cy.contains('td', 'Ordenes');
    });

    it('should show the available and currently selected templates', () => {
      cy.contains('tr', 'Ordenes').contains('button', 'Edit').click();
      cy.get('aside').within(() => {
        cy.getByTestId('multiselect').within(() => {
          cy.get('button').eq(0).click();
          cy.contains('Mecanismo').should('not.exist');
          cy.contains('País').should('not.exist');
          cy.contains('Ordenes de la corte').should('exist');
          cy.contains('Sentencia de la corte').should('exist');
          cy.contains('Ordenes del presidente').should('exist');
          cy.get('button').eq(0).click();
        });
      });
    });

    it('should validate group format', () => {
      cy.get('aside').within(() => {
        cy.get('#group-name').clear();
        cy.contains('button', 'Update').click();
        cy.contains('This field is required');
        cy.get('#group-name').type('Reportes y causas', { delay: 0 });
        cy.getByTestId('multiselect').within(() => {
          cy.get('button').eq(1).click();
          cy.get('button').eq(1).click();
          cy.get('button').eq(1).click();
        });
        cy.contains('button', 'Update').click();
      });
      cy.contains('tr', 'Reportes y causas').contains('Group').click();
      cy.contains('Empty group. Drop here to add');
    });

    it('should create a another group', () => {
      cy.contains('button', 'Add group').click();
      cy.get('aside').within(() => {
        cy.get('#group-name').type('Ordenes', { delay: 0 });
        cy.getByTestId('multiselect').within(() => {
          cy.get('button').click();
          cy.contains('Voto Separado').click();
          cy.contains('Ordenes del presidente').click();
          cy.contains('Medida Provisional').click();
          cy.contains('Sentencia de la corte').click();
        });
        cy.contains('button', 'Add').click();
      });
    });

    it('should create an empty group', () => {
      cy.contains('button', 'Add group').click();
      cy.get('aside').within(() => {
        cy.get('#group-name').type('Other documents', { delay: 0 });
        cy.contains('button', 'Add').click();
      });
      cy.contains('tr', 'Other documents').contains('button', 'Group').click();
      cy.contains('Empty group. Drop here to add');
    });

    it('should edit the group and add an item', () => {
      cy.contains('tr', 'Other documents').contains('button', 'Edit').click();
      cy.get('aside').within(() => {
        cy.getByTestId('multiselect').within(() => {
          cy.get('button').click();
          cy.contains('Juez y/o Comisionado').click();
        });
        cy.contains('button', 'Update').click();
      });
      cy.contains('tr', 'Other documents').contains('button', 'Group').click();
      cy.contains('tr', 'Juez y/o Comisionado');
    });

    it('should save and delete empty groups', () => {
      cy.contains('button', 'Save').click();
      cy.contains('Filters saved');
      cy.contains('button', 'Dismiss').click();
      cy.contains('tr', 'Reportes y causas').should('not.exist');
    });
  });

  describe('check library', () => {
    it('should verify the library is updated', () => {
      cy.contains('a', 'Library').click();
      cy.get('#filtersForm > :nth-child(2) > .search__filter').within(() => {
        cy.get('[title="Mecanismo"]');
        cy.get('[title="País"]');
        cy.contains('div.multiselectItem', 'Ordenes').within(() => {
          cy.get('span.multiselectItem-action').click();
        });
        cy.get('[title="Voto Separado"]');
        cy.get('[title="Ordenes del presidente"]');
        cy.get('[title="Medida Provisional"]');
        cy.get('[title="Sentencia de la corte"]');
        cy.contains('div.multiselectItem', 'Other documents').within(() => {
          cy.get('span.multiselectItem-action').click();
        });
        cy.get('[title="Juez y/o Comisionado"]');
        cy.contains('div.multiselectItem', 'Reportes y causas').should('not.exist');
      });
    });
  });

  describe('deletion', () => {
    it('should delete single filters', () => {
      cy.contains('a', 'Settings').click();
      cy.contains('a', 'Filter').click();
      cy.contains('caption', 'Filters').click();
      cy.contains('tr', 'Mecanismo').contains('Select').click();
      cy.contains('button', 'Delete').click();
      cy.contains('button', 'Save').click();
      cy.contains('Filters saved');
      cy.contains('button', 'Dismiss').click();
    });

    it('should delete group items and an entire group', () => {
      cy.contains('tr', 'Ordenes').contains('button', 'Group').click();
      cy.contains('tr', 'Medida Provisional').contains('Select').click();
      cy.contains('tr', 'Other documents').contains('Select').click();
      cy.contains('button', 'Delete').click();
      cy.contains('button', 'Save').click();
      cy.contains('Filters saved');
      cy.contains('button', 'Dismiss').click();
    });

    it('should check the results', () => {
      cy.contains('td', 'País');
      cy.contains('tr', 'Ordenes').contains('button', 'Group');
      cy.contains('td', 'Voto Separado');
      cy.contains('td', 'Ordenes del presidente');
      cy.contains('td', 'Sentencia de la corte');
    });
  });
});
