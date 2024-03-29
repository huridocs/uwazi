import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers';

describe('Activity log', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin();
    cy.intercept('GET', '/api/activitylog').as('fetchActivitylog');
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.contains('span', 'Activity log').click();
    cy.wait('@fetchActivitylog');
    cy.injectAxe();
  });

  it('should have no detectable accessibility violations on load', () => {
    cy.checkA11y();
  });

  it('should load the first one hundred entries of activity log', () => {
    cy.checkA11y();
  });
});
