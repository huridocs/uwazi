/* eslint-disable max-lines */
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
    it('should verify PX dummy service is reachable', () => {
      const pxUrl = Cypress.env('PARAGRAPH_EXTRACTION_URL') || 'http://127.0.0.1:5051';
      cy.log(`Checking PX service at ${pxUrl}`);
      cy.request({ url: pxUrl, failOnStatusCode: false }).its('status').should('be.gte', 100);
    });

    it('should navigate to the PX dashboard', () => {
      cy.contains('a', 'Settings').click();
      cy.contains('a', 'Paragraph Extraction').click();
      cy.contains('Extractors');
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
      cy.get('tbody tr td:nth-child(4) span:nth-child(1)').contains('0');
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
      cy.contains('Paragraphs');
    });

    it('should whait until the first entity shows and check the result', () => {
      cy.contains(
        'tr',
        'Apitz Barbera y otros. Resolución de la Presidenta de 18 de diciembre de 2009',
        { timeout: 40000 }
      );
    });

    it('should check the results', () => {
      cy.get('tbody tr').should('have.length', 3);
      checkCells(
        1,
        'Apitz Barbera y otros. Resolución de la Presidenta de 18 de diciembre de 2009',
        'en',
        '0',
        'New'
      );
    });

    it('should extract the paragraphs and disable the bulk extraction button', () => {
      cy.contains('button', 'Extract new paragraphs').click();
      cy.contains('The process of extracting the paragraphs has successfully started').as(
        'successMessage'
      );
      cy.contains('Dismiss').click();
      cy.contains('button', 'Extract new paragraphs').should('be.disabled');
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

    let firstEntityProcessed = '';

    it('should update the processed entities after 25 seconds', () => {
      cy.contains('tbody tr', 'New').should('not.exist');
      cy.contains('tbody tr', 'Processed', { timeout: 40000 })
        .eq(0)
        .within(() => {
          cy.get('td:nth-child(2) > span')
            .eq(0)
            .invoke('text')
            .then(text => {
              firstEntityProcessed = text.trim();
            });
        });
    });

    it('should check for a11y violations', () => {
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500); // wait for page to settle
      cy.injectAxe();
      cy.checkA11y();
    });

    it('should change an entity by uploading another file to generate an obsolete extraction', () => {
      cy.contains('a', 'Library').click();
      cy.contains('li', 'Ordenes del presidente').click();
      cy.contains(
        'div.item-document.template-58ada34c299e82674854505b',
        firstEntityProcessed
      ).click();
      cy.get('aside.side-panel.metadata-sidepanel.is-active').within(() => {
        cy.contains('h1', firstEntityProcessed);
        cy.get('#upload-button-input').selectFile('./cypress/test_files/single_page.pdf', {
          force: true,
        });
        cy.contains('Success, Upload another?');
      });
    });

    it('should return to the extractor and check the UI state', () => {
      cy.contains('a', 'Settings').click();
      cy.contains('a', 'Paragraph Extraction').click();
      cy.contains('Extractors');
      cy.contains('tr', 'Ordenes del presidente').within(() => {
        cy.contains('td', '3');
        cy.contains('span', '1 New').should('not.exist');
        cy.contains('button', 'View').click();
      });
    });

    it('should contain an obsolete extraction', () => {
      cy.contains('Obsolete', { timeout: 40000 });
    });

    it('should check filtering and that the bulk extract button remains disabled', () => {
      cy.contains('button', 'Filters').click();
      cy.contains('label', 'Error').find('input[type="checkbox"]').check();
      cy.contains('button', 'Apply').click();
      cy.contains('tbody', 'NO DATA AVAILABLE');
      cy.contains('button', 'Filters').click();
      cy.contains('button', 'Clear All').click();
      cy.contains('label', 'Obsolete').find('input[type="checkbox"]').check();
      cy.contains('label', 'Processed').find('input[type="checkbox"]').check();
      cy.contains('button', 'Apply').click();
      cy.contains('button', 'Extract new paragraphs').should('be.disabled');
    });

    it('should extract paragraphs for the obsolete entity and not loose filters', () => {
      cy.contains('tr', 'Obsolete').within(() => {
        cy.get('input[type="checkbox"]').click();
      });
      cy.contains('Extract paragraphs').click();
      cy.contains('h1', 'Are you sure?');
      cy.contains('button', 'Continue').click();
      cy.contains('The process of extracting the paragraphs has successfully started');
      cy.contains('Dismiss').click();
      cy.contains('button', 'Filters').click();
      cy.contains('label', 'Obsolete').find('input[type="checkbox"]').should('be.checked');
      cy.contains('label', 'Processed').find('input[type="checkbox"]').should('be.checked');
      cy.contains('button', 'Clear All').click();
      cy.contains('label', 'Obsolete').find('input[type="checkbox"]').should('not.be.checked');
      cy.contains('label', 'Processed').find('input[type="checkbox"]').should('not.be.checked');
      cy.contains('button', 'Apply').click();
    });
  });

  let firstEntityProcessed = '';

  describe('Paragraphs Dashboard', () => {
    it('should navigate to the PX Paragraphs List', () => {
      cy.contains('tbody tr', 'Processed', { timeout: 40000 })
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
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500); // wait for page to settle
      cy.injectAxe();
      cy.checkA11y();
    });

    it('should view the extracted paragraphs', () => {
      cy.contains('For e2e paragraph 0 in en');
      cy.get('tbody tr').should('have.length.at.least', 3);
    });

    it('should open the PDF side panel', () => {
      cy.get('[data-testid="settings-paragraph-extractor"]').first().scrollIntoView();
      cy.contains('Ordenes del presidente');
      cy.contains('button', 'Open PDF').should('be.visible').click();
      cy.get('aside', { timeout: 15000 })
        .should('be.visible')
        .within(() => {
          cy.contains(firstEntityProcessed);
        });
      cy.get('#pdf-container .pdf-page').should('have.length.at.least', 2);
      cy.contains('aside button', 'Close').click();
    });

    it('should open the entity in the specific language', () => {
      cy.contains('tbody tr', 'For e2e paragraph 0 in en').scrollIntoView();
      cy.contains('tbody tr', 'For e2e paragraph 0 in en')
        .contains('span', 'Group')
        .should('be.visible')
        .click();
      cy.contains('tbody tr', 'ar');
      cy.contains('tbody tr', 'es');
      cy.contains('tbody tr', 'es').contains('button', 'View').should('be.visible').click();
      cy.get('aside', { timeout: 20000 })
        .should('be.visible')
        .within(() => {
          cy.contains('Entity');
          cy.contains(firstEntityProcessed);
          cy.contains('Español');
          cy.contains('For e2e paragraph 0 in en');
        });
    });
  });
});
