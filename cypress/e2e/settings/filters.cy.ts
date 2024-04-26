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

  it('should edit the group', () => {
    cy.contains('td', 'My filter group 1').parent().contains('button', 'Edit').click();
    cy.get('aside').within(() => {
      cy.get('#group-name').clear();
      cy.get('#group-name').type('Ordenes', { delay: 0 });
      cy.contains('button', 'Update').click();
    });
    cy.contains('td', 'Ordenes');
  });

  it('should show the available and currentyl selected templates', () => {
    cy.contains('td', 'Ordenes').parent().contains('button', 'Edit').click();
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
      cy.contains('This field is required');
      cy.getByTestId('multiselect').within(() => {
        cy.get('button').eq(0).click();
        cy.contains('Causa').click();
        cy.contains('Report').click();
      });
      cy.contains('Update').click();
    });
    cy.contains('td', 'Reportes y causas');
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
    cy.contains('button', 'Save').click();
    cy.contains('Filters saved');
    cy.contains('button', 'Dismiss').click();
  });

  it('should verify the library is updated', () => {
    cy.contains('a', 'Library').click();
    cy.get('#filtersForm > :nth-child(2) > .search__filter').within(() => {
      cy.contains('div.multiselectItem', 'Ordenes').within(() => {
        cy.get('span.multiselectItem-action').click();
      });
      cy.get('[title="Voto Separado"]');
      cy.get('[title="Ordenes del presidente"]');
      cy.get('[title="Medida Provisional"]');
      cy.get('[title="Sentencia de la corte"]');
      cy.contains('div.multiselectItem', 'Reportes y causas');
      cy.get('[title="Mecanismo"]');
      cy.get('[title="País"]');
    });
  });

  describe('deletion', () => {
    it('should delete single filters', () => {
      cy.contains('a', 'Settings').click();
      cy.contains('a', 'Filter').click();
      cy.contains('caption', 'Filters').click();
      cy.contains('td', 'Mecanismo')
        .parent()
        .within(() => {
          cy.get('input[type=checkbox]').click();
        });
      cy.contains('button', 'Delete').click();
      cy.contains('button', 'Save').click();
      cy.contains('Filters saved');
      cy.contains('button', 'Dismiss').click();
    });

    it('should delete group items', () => {
      cy.contains('td', 'Reportes y causas').within(() => {
        cy.contains('button', 'Group').click();
      });
      cy.contains('td', 'Causa')
        .parent()
        .within(() => {
          cy.get('input[type=checkbox]').click();
        });

      cy.contains('button', 'Delete').click();
      cy.contains('button', 'Save').click();
      cy.contains('Filters saved');
      cy.contains('button', 'Dismiss').click();
    });

    it('should delete a group', () => {
      cy.contains('td', 'Ordenes')
        .parent()
        .within(() => {
          cy.get('input[type=checkbox]').click();
        });
      cy.contains('button', 'Delete').click();
      cy.contains('button', 'Save').click();
      cy.contains('Filters saved');
      cy.contains('button', 'Dismiss').click();
    });

    it('should check sepecifically deleted items', () => {
      cy.contains('td', 'Mecanismo').should('not.exist');
      cy.contains('td', 'Causa').should('not.exist');
      cy.contains('td', 'Ordenes').should('not.exist');
    });
  });
});
