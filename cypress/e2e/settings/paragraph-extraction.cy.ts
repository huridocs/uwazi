/* eslint-disable max-statements */
import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers';

describe('Paragraph Extraction', () => {
  before(() => {
    const env = {
      DATABASE_NAME: 'uwazi_e2e',
      INDEX_NAME: 'uwazi_e2e',
      FEATURE_FLAG_PARAGRAPH_EXTRACTION: 'true',
    };
    cy.exec('yarn e2e-fixtures', { env });
    cy.exec('yarn ix-config', { env });
    clearCookiesAndLogin();
    cy.injectAxe();
    cy.window().then(win => {
      (
        win as typeof window & { __featureFlags__?: { paragraphExtraction: boolean } }
      ).__featureFlags__ = { paragraphExtraction: true };
    });
  });

  describe('Extractor Dashboard', () => {
    it('should navigate to the PX dashboard', () => {
      cy.contains('a', 'Settings').click();
      cy.contains('a', 'Paragraph Extraction').click();
      cy.get('table').contains('caption', 'Extractors');
    });

    it('should check for a11y violations', () => {
      cy.checkA11y();
    });

    it('should open the create extractor dialog', () => {
      cy.contains('button', 'Add extractor').click();
      cy.contains('h1', 'Target template');
      cy.contains('button', 'Next').should('be.disabled');
    });

    it('should select the target template', () => {
      cy.contains('button', 'Causa').contains('Select').click();
      cy.contains('button', 'Causa').contains('Selected');
      cy.contains('button', 'Next').click();
    });

    it('should select source template', () => {
      cy.contains('h1', 'Source template');
      cy.contains('button', 'Next').should('be.disabled');
      cy.get('#search-multiselect').type('Ordenes del presidente', { delay: 0 });
      cy.contains('li button', 'Ordenes del presidente').click();
      cy.contains('li button', 'Ordenes del presidente').contains('Selected');
      cy.contains('button', 'Next').click();
    });

    it('should configure extraction', () => {
      cy.contains('h1', 'Extraction configuration');
      cy.contains('button', 'Create').should('be.disabled');
      cy.get('#rich-text-property').select('Resumen');
      cy.get('#numeric-text-property').select('Número del expediente');
      cy.get('#target-relationship-type').select('Relacionado a');
      cy.get('#source-relationship-type').select('Descriptores');
      cy.contains('button', 'Create').click();
    });

    it('should show a success notification', () => {
      cy.contains('Paragraph Extractor added');
      cy.contains('Dismiss').click();
    });

    it('should contain the extractor created', () => {
      cy.get('thead tr th:nth-child(2)').contains('Source Template');
      cy.get('thead tr th:nth-child(3)').contains('Target Template');
      cy.get('thead tr th:nth-child(4)').contains('Entities');

      cy.get('tbody tr td:nth-child(2)').contains('Ordenes del presidente');
      cy.get('tbody tr td:nth-child(3)').contains('Causa');
      cy.get('tbody tr td:nth-child(4) span:nth-child(1)').contains('3');
      cy.get('tbody tr td:nth-child(4) span[data-testid="pill-comp"]').contains('3 New');
    });
  });
  describe('Entities Dashboard', () => {
    const checkCells = (
      row: number,
      title: string,
      language: string,
      count: string,
      status: string
      // eslint-disable-next-line max-params
    ) => {
      cy.get(`tr:nth-child(${row}) > td:nth-child(2) > span`).contains(title);
      cy.get(`tr:nth-child(${row}) > td:nth-child(3) span`).contains(language);
      cy.get(`tr:nth-child(${row}) > td:nth-child(4) > span`).contains(count);
      cy.get(`tr:nth-child(${row}) > td:nth-child(5) span`).contains(status);
    };

    it('should navigate to the PX Entities List', () => {
      cy.contains('tbody tr', 'Ordenes del presidente').contains('button', 'View').click();
      cy.url().should('include', '/settings/paragraph-extraction/');
    });

    it('should check for a11y violations', () => {
      cy.checkA11y();
    });

    it('should view the details of the extractor and navigate through the flow', () => {
      cy.get('table').contains('caption', 'Paragraphs');
      cy.get('tbody tr').should('have.length', 3);
      checkCells(
        1,
        'Apitz Barbera y otros. Resolución de la Presidenta de 18 de diciembre de 2009',
        'en',
        '0',
        'New'
      );
    });

    it('should extract the paragraphs', () => {
      cy.contains('button', 'Extract new paragraphs').click();
      cy.contains('Paragraphs extracted').as('successMessage');
      cy.contains('Dismiss').click();
    });

    it('should change the status to processing', () => {
      cy.contains('tbody tr', 'New').should('not.exist');
      checkCells(
        2,
        'Artavia Murillo y otros. Resolución de la CorteIDH de 26 de febrero de 2016',
        'en',
        '0',
        'Processing'
      );
    });

    it('should update the processed entities after 25 seconds', () => {
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(30000); //wait for processing to finish
      cy.contains('tbody tr', 'New').eq(0).should('not.have.text', '0', {
        timeout: 30000,
      });
    });
  });

  let firstEntityProcessed = '';

  describe('Paragraphs Dashboard', () => {
    it('should navigate to the PX Paragraphs List', () => {
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000); //wait for loader paragraphs to finish

      cy.contains('tbody tr', 'New')
        .eq(0)
        .within(() => {
          cy.get('td:nth-child(2) > span')
            .eq(0)
            .invoke('text')
            .then(text => {
              firstEntityProcessed = text.trim();
            });
          cy.contains('button', 'View').click();
        });
      cy.url().should('include', '/settings/paragraph-extraction/');
    });

    it('should check for a11y violations', () => {
      cy.checkA11y();
    });

    it('should view the extracted paragraphs', () => {
      cy.get('table')
        .contains('caption', 'Paragraphs')
        .should(
          'contain.text',
          `${firstEntityProcessed}Ordenes del presidenteEnglishالعربيةEspañolOpen PDF`
        );
      cy.contains('For e2e paragraph 0 in en');
      cy.get('tbody tr').should('have.length.at.least', 3);
    });

    it('should open the PDF side panel', () => {
      cy.get('[data-testid="settings-paragraph-extractor"]').scrollIntoView();
      cy.contains('table caption', 'Ordenes del presidente').contains('button', 'Open PDF').click();
      cy.contains('aside', firstEntityProcessed);
      cy.get('#pdf-container .pdf-page').should('have.length.at.least', 2);
      cy.contains('aside button', 'Close').click();
    });

    it('should open the entity in the specific language', () => {
      cy.contains('tbody tr', 'For e2e paragraph 0 in en').scrollIntoView();
      cy.contains('tbody tr', 'For e2e paragraph 0 in en').contains('span', 'Group').click();
      cy.contains('tbody tr', 'ar');
      cy.contains('tbody tr', 'es');
      cy.contains('tbody tr', 'es').contains('button', 'View').click();
      cy.contains('aside', 'Entity');
      cy.contains('aside', firstEntityProcessed);
      cy.contains('aside', 'Español');
      cy.contains('aside', 'For e2e paragraph 0 in en');
    });
  });
});
