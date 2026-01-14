/* eslint-disable max-lines */
import { clearCookiesAndLogin } from '../helpers';

const removeEntity = (title: string) => {
  cy.contains('div.rightRelationship', title).scrollIntoView();
  cy.contains('div.rightRelationship', title).within(() => {
    cy.get('div.removeEntity').within(() => {
      cy.get('button').click();
    });
  });
  cy.contains('div.rightRelationship.deleted', title);
};

const selectEntityToMove = (title: string) => {
  cy.contains('div.rightRelationship', title).scrollIntoView();
  cy.contains('div.rightRelationship', title).within(() => {
    cy.get('div.moveEntity').within(() => {
      cy.get('button').click();
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
      cy.get('ul.search__filter').contains('label', 'Causa').click();
      cy.contains(
        'div.item-document',
        'Acevedo Buendia et al (Discharged and Retired Employees of the Office of the Comptroller)'
      ).within(() => {
        cy.contains('a', 'View').click();
      });
      cy.contains(
        'h1',
        'Acevedo Buendia et al (Discharged and Retired Employees of the Office of the Comptroller)'
      );
      cy.contains('a', 'Relationships').click();
      cy.get('#tabpanel-relationships').should('be.visible');
    });

    it('should should sort the relationships by Fecha property', () => {
      cy.intercept('GET', '/api/references/search*').as('referencesSearch');
      cy.get('div.sort-buttons').contains('Date added').click();
      cy.get('div.rw-popup-container').should('be.visible').contains('Fecha').click();
      cy.get('div.sort-buttons').contains('Fecha');
      cy.wait('@referencesSearch');
      cy.get('div.relationshipsHub')
        .first()
        .contains('Acevedo Buendía y otros. Resolución de la CorteIDH de 28 de enero de 2015');
      cy.get('div.relationshipsHub').last().contains('Peru');
    });

    it('should should sort the relationships by Fecha property in the reverted order', () => {
      cy.intercept('GET', '/api/references/search*').as('referencesSearch');
      cy.get('div.sort-buttons').within(() => {
        cy.get('button.sorting-toggle').click();
      });
      cy.wait('@referencesSearch');
      cy.get('div.relationshipsHub')
        .first()
        .contains('Acevedo Buendía et al. Admissibility Report N° 47/02');
    });

    it('should filter by searching', () => {
      cy.intercept('GET', '/api/references/search*').as('librarySearch');
      cy.get('div.relationship-toolbar').within(() => {
        cy.get('input').eq(0).click();
        cy.get('input').eq(0).type('2009');
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
      cy.contains('a', 'Library').click();
      cy.get('ul.search__filter').contains('label', 'Ordenes del presidente').click();
      cy.contains(
        'div.item-document',
        'Artavia Murillo y otros. Resolución de la CorteIDH de 26 de febrero de 2016'
      ).within(() => {
        cy.contains('a', 'View').click();
      });
      cy.contains(
        'h1',
        'Artavia Murillo y otros. Resolución de la CorteIDH de 26 de febrero de 2016'
      );
      cy.contains('a', 'Relationships').click();
      cy.get('#tabpanel-relationships').should('be.visible');
    });

    it('should be able to remove entities from a hub', () => {
      cy.contains('button', 'Edit').click();
      removeEntity('Diego García-Sayán');
      removeEntity('Costa Rica');
      cy.get('div.entity-footer').contains('button', 'Save').click();
      cy.contains('div.rightRelationship', 'Diego García-Sayán').should('not.exist');
      cy.contains('div.rightRelationship', 'Costa Rica').should('not.exist');
    });

    it('should be able to add an existing entity into a hub', () => {
      cy.contains('button', 'Edit').click();
      cy.get('div.relationshipsHub')
        .first()
        .within(() => {
          cy.contains('button', 'Add entities / documents').click();
        });
      cy.get('aside.side-panel.create-reference.is-active').should('be.visible');
      cy.get('aside.side-panel.create-reference.is-active').within(() => {
        cy.get('input').click();
        cy.get('input').type('Anzualdo Castro');
        cy.get('div.item').contains('Anzualdo Castro').click();
      });
      cy.get('div.relationshipsHub')
        .first()
        .within(() => {
          cy.contains('div', 'Anzualdo Castro');
        });
      cy.get('div.entity-footer').contains('button', 'Save').click();
      cy.get('div.relationshipsHub')
        .first()
        .within(() => {
          cy.contains('div', 'Anzualdo Castro');
        });
      cy.waitForLegacyNotifications();
    });

    // eslint-disable-next-line max-statements
    it('should be able to create a new entity and add it to the last existing hub', () => {
      cy.contains('button', 'Edit').should('be.visible').click();
      cy.get('div.relationshipsHub')
        .eq(2)
        .within(() => {
          cy.contains('button', 'Add entities / documents').click();
        });
      cy.get('aside.side-panel.create-reference.is-active').should('be.visible');
      cy.get('aside.side-panel.create-reference.is-active').within(() => {
        cy.contains('button', 'Create Entity').click();
      });
      cy.get('aside.side-panel.connections-metadata.is-active').should('be.visible');
      cy.get('aside.side-panel.connections-metadata.is-active').within(() => {
        cy.get('textarea[name="relationships.metadata.title"]').type('My test Mecanismo');
        cy.contains('button', 'Save').click();
      });
      cy.get('div.entity-footer').contains('button', 'Save').click();
      cy.get('div.relationshipsHub')
        .eq(2)
        .within(() => {
          cy.contains('div', 'My test Mecanismo');
        });
      cy.waitForLegacyNotifications();
    });

    it('should be able to move entities from the second hub to the first one', () => {
      cy.contains('button', 'Edit').should('be.visible').click();
      selectEntityToMove('Roberto de Figueiredo Caldas');
      selectEntityToMove('Humberto Antonio Sierra Porto');
      cy.get('div.relationshipsHub').first().scrollIntoView();
      cy.get('div.relationshipsHub')
        .first()
        .within(() => {
          cy.get('div.insertEntities > button.relationships-icon').click();
        });
      cy.get('div.entity-footer').contains('button', 'Save').click();
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

  describe('hub actions', () => {
    it('should navigate to another relationship view', () => {
      cy.visit('http://localhost:3000');
      cy.get('ul.search__filter')
        .contains('label', 'Informe de admisibilidad')
        .should('be.visible');
      cy.get('ul.search__filter').contains('label', 'Informe de admisibilidad').click();
      cy.contains(
        'div.item-document',
        'Artavia Murillo and others. Admissibility Report N° 25/04'
      ).within(() => {
        cy.contains('a', 'View').click();
      });
      cy.contains('h1', 'Artavia Murillo and others. Admissibility Report N° 25/04');
      cy.contains('a', 'Relationships').click();
      cy.get('#tabpanel-relationships').should('be.visible');
    });

    it('should start edition mode', () => {
      cy.contains('button', 'Edit').should('be.visible').click();
    });

    it('should remove the second hub completly', () => {
      cy.get('div.relationshipsHub')
        .eq(1)
        .within(() => {
          cy.get('div.removeRightRelationshipGroup > button.relationships-icon').click();
        });
    });

    it('shoud empty the last hub', () => {
      removeEntity('Costa Rica');
    });

    it('should create a new hub', () => {
      cy.contains('button', 'New relationships group').click();
      cy.get('div.relationshipsHub')
        .eq(4)
        .within(() => {
          cy.contains('div.rw-widget-input', 'New relationship type').click();
          cy.contains('li', 'Paises').click();
        });
      cy.get('aside.side-panel.create-reference.is-active').should('be.visible');
      cy.get('aside.side-panel.create-reference.is-active').within(() => {
        cy.get('input').click();
        cy.get('input').type('Argentina');
        cy.get('div.item').contains('Argentina').click();
      });
    });

    it('should save all the changes and verify them', () => {
      cy.get('div.entity-footer').contains('button', 'Save').click();
      cy.get('div.relationshipsHub').should('have.length', 3);
      cy.get('div.rightRelationships')
        .eq(0)
        .within(() => {
          cy.contains('div.rightRelationshipType', 'Commission');
          cy.contains('div.rightRelationship', 'Artavia Murillo et al');
        });
      cy.get('div.rightRelationships')
        .eq(1)
        .within(() => {
          cy.contains('div.rightRelationshipType', 'Mecanismo');
          cy.contains('div.rightRelationship', 'Comisión Interamericana de Derechos Humanos');
        });
      cy.get('div.rightRelationships')
        .eq(2)
        .within(() => {
          cy.contains('div.rightRelationshipType', 'Paises');
          cy.contains('div.rightRelationship', 'Argentina');
        });
    });
  });

  describe('relationships check', () => {
    it('should navigate to the entity used to create a new relationship in the previous step', () => {
      cy.visit('http://localhost:3000/en/entity/gq5x91tl5vdndn29/relationships');
      cy.get('#tabpanel-relationships').should('be.visible');
    });

    it('should contain the reference to the related entity', () => {
      cy.get('div.rightRelationships')
        .eq(0)
        .within(() => {
          cy.contains(
            'div.rightRelationshipType',
            'Artavia Murillo and others. Admissibility Report N° 25/04'
          );
        });
    });

    it('should navigate to the entity that was removed from the relationships in the previous step', () => {
      cy.visit('http://localhost:3000/en/entity/9t6z1x5idsdr6bt9/relationships');
      cy.get('#tabpanel-relationships').should('be.visible');
    });

    it('should not contain the reference to the related entity', () => {
      cy.contains(
        'div.rightRelationshipType',
        'Artavia Murillo and others. Admissibility Report N° 25/04'
      ).should('not.exist');
    });
  });
});
