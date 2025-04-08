import { clearCookiesAndLogin } from '../helpers';
import 'cypress-axe';

xdescribe('Paragraph Extraction', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    cy.exec('yarn ix-config', { env });
    clearCookiesAndLogin();
    cy.injectAxe();
  });

  describe('Extractor dashboard', () => {
    it('should navigate to the PX dashboard', () => {
      cy.contains('a', 'Settings').realClick();
      cy.contains('a', 'Paragraph Extraction').realClick();
      cy.get('table').contains('caption', 'Extractors');
    });

    it('should check for a11y violations', () => {
      cy.checkA11y();
    });

    it('should create a new extractor', () => {
      cy.contains('button', 'Add extractor').realClick();
      cy.contains('h1', 'Target template');
      cy.contains('button', 'Next').should('be.disabled');
      cy.contains('button', 'Causa').contains('Select').realClick();
      cy.contains('button', 'Causa').contains('Selected');
      cy.contains('button', 'Next').realClick();

      cy.contains('h1', 'Extraction configuration');
      cy.contains('button', 'Next').should('be.disabled');
      cy.get('#rich-text-property').select('Resumen');
      cy.get('#numeric-text-property').select('Número del expediente');
      cy.get('#target-relationship-type').select('País');
      cy.get('#source-relationship-type').select('País');
      cy.contains('button', 'Next').realClick();

      cy.contains('h1', 'Source template');
      cy.contains('button', 'Create').should('be.disabled');
      cy.get('#search-multiselect').type('país', { delay: 0 });
      cy.contains('li button', 'País').realClick();
      cy.contains('li button', 'País').contains('Selected');
      cy.contains('button', 'Create').realClick();
    });

    it('should list the new extractor', () => {
      cy.contains('Paragraph Extractor added');
      cy.get('thead tr th:nth-child(2)').contains('Source Template');
      cy.get('thead tr th:nth-child(3)').contains('Target Template');
      cy.get('thead tr th:nth-child(4)').contains('Entities');

      cy.get('tbody tr td:nth-child(2)').contains('País');
      cy.get('tbody tr td:nth-child(3)').contains('Causa');
      cy.get('tbody tr td:nth-child(4) span:nth-child(1)').contains('0');
      cy.get('tbody tr td:nth-child(4) span[data-testid="pill-comp"]').contains('0 New');
    });

    it('should view the details of the extractor', () => {
      cy.contains('tbody tr', 'País').contains('button', 'View').realClick();
    });
  });
});
