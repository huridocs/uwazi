import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers';

describe('Activity log', () => {
  // eslint-disable-next-line max-statements
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin('editor', 'editor');
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.contains('span', 'Account').click();
    cy.contains('button', 'Enable').click();
    cy.contains('button', 'Cancel').click();
    cy.clearAndType('input[name=email]', 'editor@uwazi.com');
    cy.contains('button', 'Update').click();

    clearCookiesAndLogin();
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.contains('span', 'Activity log').click();
    cy.contains('editor');
    cy.injectAxe();
  });

  it('should pass accessibility check', () => {
    cy.checkA11y();
  });

  it('should list the last activity log entries', () => {
    cy.get('tr').should('have.length.at.least', 20);
    cy.get('tr').eq(1).toMatchImageSnapshot();
    cy.get('tr').eq(2).toMatchImageSnapshot();
  });

  it('should filter by user', () => {
    cy.clearAndType('input[name=username]', 'editor');
    cy.contains('Updated user');
    cy.get('tr').should('have.length.at.most', 15);
  });

  it('should show a tooltip with the detail of an activity entry', () => {
    cy.get('input[name=username]').clear();
    cy.contains('admin');
    cy.get('tr')
      .eq(1)
      .within(() => {
        cy.contains('Updated user').invoke('show').trigger('mouseenter');
      });
    cy.get('table').eq(0).toMatchImageSnapshot();
    cy.get('tr')
      .eq(1)
      .within(() => {
        cy.contains('Updated user').trigger('mouseleave');
      });
  });

  it('should update the list when filters are cleaned', () => {
    cy.get('tr').should('have.length.at.least', 20);
  });

  it('should open the detail of an entry', () => {
    cy.get('input[name=username]').clear();
    cy.contains('Updated translations')
      .parent()
      .parent()
      .scrollIntoView({ offset: { top: -30, left: 0 } });
    cy.contains('Updated translations').parent().parent().siblings().contains('View').click();
    cy.get('aside').eq(0).toMatchImageSnapshot();
    cy.get('button[data-testid]=close-sidepanel').click();
  });

  it('should filter by method', () => {
    cy.clearAndType('input[name=search]', 'DELETE');
    cy.contains('editor');
    cy.get('tr').should('have.length.at.most', 5);
  });

  it('should filter by dates', () => {
    cy.get('input[name=search]').clear();
    cy.get('input[name=start]').type('2023-06-22', { delay: 0 });
    cy.get('input[name=end]').clear();
    cy.get('input[name=end]').type('2023-06-23', { delay: 0 });
    cy.contains('admin');
    cy.get('tr').should('have.length.at.most', 2);
  });
});
