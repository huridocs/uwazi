import { clearCookiesAndLogin } from './helpers';

const removeEntity = (title: string) => {
  cy.contains('div.rightRelationship', title).scrollIntoView();
  cy.contains('div.rightRelationship', title).within(() => {
    cy.get('div.removeEntity').within(() => {
      cy.get('button').realClick();
    });
  });
  cy.contains('div.rightRelationship.deleted', title);
};

const selectEntityToMove = (title: string) => {
  cy.contains('div.rightRelationship', title).scrollIntoView();
  cy.contains('div.rightRelationship', title).within(() => {
    cy.get('div.moveEntity').within(() => {
      cy.get('button').realClick();
    });
  });
  cy.contains('div.rightRelationship.move', title);
};

describe('Relationship view', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin();
  });

  describe('sorting and filtering', () => {
    it('should navigate to an entities relationship view', () => {
      cy.get('ul.search__filter').contains('label', 'Causa').realClick();
      cy.contains(
        'div.item-document',
        'Acevedo Buendia et al (Discharged and Retired Employees of the Office of the Comptroller)'
      ).within(() => {
        cy.contains('a', 'View').realClick();
      });
      cy.contains(
        'h1',
        'Acevedo Buendia et al (Discharged and Retired Employees of the Office of the Comptroller)'
      );
      cy.contains('a', 'Relationships').realClick();
      cy.get('#tabpanel-relationships').should('be.visible');
    });

    it('should should sort the relationships by Fecha property', () => {
      cy.get('div.sort-buttons').contains('Date added').realClick();
      cy.get('div.rw-popup-container').contains('Fecha').realClick();
      cy.get('div.relationshipsHub')
        .first()
        .contains('Acevedo Buendía y otros. Resolución de la CorteIDH de 28 de enero de 2015');
      cy.get('div.relationshipsHub').last().contains('Peru');
      cy.get('div.sort-buttons').within(() => {
        cy.get('button.sorting-toggle').realClick();
      });
      cy.get('div.relationshipsHub')
        .first()
        .contains('Acevedo Buendía et al. Admissibility Report N° 47/02');
    });

    it('should filter by searching', () => {
      cy.intercept('GET', '/api/references/search*').as('librarySearch');
      cy.get('div.relationship-toolbar').within(() => {
        cy.get('input').realClick().realType('2009');
      });
      cy.wait('@librarySearch');
      cy.get('div.relationshipsHub').should('have.length', 1);
      cy.get('div.item-document')
        .contains('Acevedo Buendia et al. Judgment. July 1, 2009')
        .should('have.length', 1);
    });
  });

  describe('editing existing hubs', () => {
    it('should navigate to another relationship view', () => {
      cy.contains('a', 'Library').realClick();
      cy.get('ul.search__filter').contains('label', 'Ordenes del presidente').realClick();
      cy.contains(
        'div.item-document',
        'Artavia Murillo y otros. Resolución de la CorteIDH de 26 de febrero de 2016'
      ).within(() => {
        cy.contains('a', 'View').realClick();
      });
      cy.contains(
        'h1',
        'Artavia Murillo y otros. Resolución de la CorteIDH de 26 de febrero de 2016'
      );
      cy.contains('a', 'Relationships').realClick();
      cy.get('#tabpanel-relationships').should('be.visible');
    });

    it('should be able to remove entities from a hub', () => {
      cy.contains('button', 'Edit').realClick();
      removeEntity('Diego García-Sayán');
      removeEntity('Costa Rica');
      cy.get('div.entity-footer').contains('button', 'Save').realClick();
      cy.contains('div.rightRelationship', 'Diego García-Sayán').should('not.exist');
      cy.contains('div.rightRelationship', 'Costa Rica').should('not.exist');
    });

    it('should be able to add an existing entity into a hub', () => {
      cy.contains('button', 'Edit').realClick();
      cy.get('div.relationshipsHub')
        .first()
        .within(() => {
          cy.contains('button', 'Add entities / documents').realClick();
        });
      cy.get('aside.side-panel.create-reference.is-active').should('be.visible');
      cy.get('aside.side-panel.create-reference.is-active').within(() => {
        cy.get('input').realClick();
        cy.get('input').type('Anzualdo Castro');
        cy.get('div.item').contains('Anzualdo Castro').realClick();
      });
      cy.get('div.relationshipsHub')
        .first()
        .within(() => {
          cy.contains('div', 'Anzualdo Castro');
        });
      cy.get('div.entity-footer').contains('button', 'Save').realClick();
      cy.get('div.relationshipsHub')
        .first()
        .within(() => {
          cy.contains('div', 'Anzualdo Castro');
        });
      cy.waitForLegacyNotifications();
    });

    it('should be able to create a new entity and add it to the last existing hub', () => {
      cy.contains('button', 'Edit').should('be.visible').realClick();
      cy.get('div.relationshipsHub')
        .eq(2)
        .within(() => {
          cy.contains('button', 'Add entities / documents').realClick();
        });
      cy.get('aside.side-panel.create-reference.is-active').should('be.visible');
      cy.get('aside.side-panel.create-reference.is-active').within(() => {
        cy.contains('button', 'Create Entity').realClick();
      });
      cy.get('aside.side-panel.connections-metadata.is-active').should('be.visible');
      cy.get('aside.side-panel.connections-metadata.is-active').within(() => {
        cy.get('textarea[name="relationships.metadata.title"]').type('My test Mecanismo');
        cy.contains('button', 'Save').realClick();
      });
      cy.get('div.entity-footer').contains('button', 'Save').realClick();
      cy.get('div.relationshipsHub')
        .eq(2)
        .within(() => {
          cy.contains('div', 'My test Mecanismo');
        });
      cy.waitForLegacyNotifications();
    });

    it('should be able to move entities from the second hub to the first one', () => {
      cy.contains('button', 'Edit').should('be.visible').realClick();
      selectEntityToMove('Roberto de Figueiredo Caldas');
      selectEntityToMove('Humberto Antonio Sierra Porto');
      cy.get('div.relationshipsHub').first().scrollIntoView();
      cy.get('div.relationshipsHub')
        .first()
        .within(() => {
          cy.get('div.insertEntities > button.relationships-icon').realClick();
        });
      cy.get('div.entity-footer').contains('button', 'Save').realClick();
      cy.get('div.relationshipsHub')
        .first()
        .within(() => {
          cy.contains('div', 'Roberto de Figueiredo Caldas');
          cy.contains('div', 'Humberto Antonio Sierra Porto');
        });
      cy.get('div.relationshipsHub')
        .eq(1)
        .within(() => {
          cy.contains('div', 'Roberto de Figueiredo Caldas').should('not.exist');
          cy.contains('div', 'Humberto Antonio Sierra Porto').should('not.exist');
        });
    });
  });
});
