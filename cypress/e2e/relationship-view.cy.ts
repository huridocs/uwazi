import { clearCookiesAndLogin } from './helpers';

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
});
