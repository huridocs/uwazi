import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers';

describe('Activity log', () => {
  // eslint-disable-next-line max-statements
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin('colla', 'borator');
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.contains('span', 'Account').click();
    cy.contains('button', 'Enable').click();
    cy.contains('button', 'Cancel').click();
    cy.clearAndType('input[name=email]', 'rock@stone.com1');
    cy.contains('button', 'Update').click();

    clearCookiesAndLogin();
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.contains('span', 'Activity log').click();
    cy.contains('colla');
    cy.injectAxe();
  });

  it('should have no detectable accessibility violations on load', () => {
    cy.checkA11y();
  });

  it('should list the last activity log entries', () => {
    cy.get('tr').should('have.length.at.least', 30);
    cy.get('tr').eq(1).toMatchImageSnapshot();
    cy.get('tr').eq(2).toMatchImageSnapshot();
  });

  it('should filter by user', () => {
    cy.intercept('GET', 'api/activityLog').as('fetchActivitylog');
    cy.clearAndType('input[name=username]', 'colla');
    cy.wait('@fetchActivitylog');
    cy.get('tr').should('have.length.at.most', 15);
  });

  it('should show a tooltip with the detail of an activity entry', () => {
    cy.get('tr')
      .eq(2)
      .within(() => {
        cy.contains('Updated user').invoke('show').trigger('mouseenter');
        cy.get('div[data-testid=flowbite-tooltip]').eq(2).toMatchImageSnapshot();
        cy.contains('Updated user').trigger('mouseleave');
      });
    cy.contains('button', 'Update').click();
  });
});
