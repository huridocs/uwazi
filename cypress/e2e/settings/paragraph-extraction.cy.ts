import { clearCookiesAndLogin } from '../helpers';
import 'cypress-axe';

describe('Paragraph Extraction', () => {
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

    it('should create a new extractor', () => {});

    it('should check for a11y violations', () => {
      cy.checkA11y();
    });
  });
});
