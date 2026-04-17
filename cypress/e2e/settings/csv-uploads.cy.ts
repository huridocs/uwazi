import 'cypress-axe';
import { clearCookiesAndLogin, createTemplate } from '../helpers/index.js';

describe('Upload CSVs', () => {
  before(() => {
    const env = {
      DATABASE_NAME: 'uwazi_e2e',
      INDEX_NAME: 'uwazi_e2e',
    };
    cy.exec('yarn blank-state --force', { env });
    clearCookiesAndLogin('admin', 'change this password now');
    cy.injectAxe();
    cy.window().then(win => {
      (win as typeof window & { __featureFlags__?: { v2CSVImport: boolean } }).__featureFlags__ = {
        v2CSVImport: true,
      };
    });
  });

  it('should setup the test', () => {
    cy.contains('a', 'Settings').click();
    createTemplate('For imports', ['Date']);
  });

  it('should navigate the imports UI and see the blank state message', () => {
    cy.contains('a', 'Import CSV').click();
    cy.contains('span', 'Import CSV or ZIP files to create entities in bulk.');
  });

  it('should upload a csv file', () => {
    cy.contains('button', 'Import CSV').click();
    cy.getByTestId('modal').within(() => {
      cy.contains('select', 'Document').select('For imports');
      cy.get('input[type="file"]').selectFile('./cypress/test_files/entity-import.csv', {
        force: true,
      });
      cy.contains('span', 'entity-import.csv').click();
      cy.contains('button', 'Accept').click();
    });
  });

  it('should see the results', () => {
    cy.contains('td', 'Done creating entities');
    cy.contains('td', '3');
    cy.contains('td', '1');
    cy.checkA11y();
  });

  it('should check the status of the import', () => {
    cy.contains('td', 'View').click();
    cy.contains('div', 'Entity creation stage completed.');
    cy.contains('span', '3').parent().contains('Entities created');
    cy.contains('span', '4').parent().contains('Rows processed');
    cy.contains('span', '1').parent().contains('Rows failed');
    cy.checkA11y();
  });
});
