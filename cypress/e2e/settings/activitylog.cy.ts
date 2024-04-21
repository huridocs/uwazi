import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers';

describe('Activity log', () => {
  // eslint-disable-next-line max-statements
  before(() => {
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

  const checkCells = (row: number, column: number, element: string) => {
    cy.get(`tr:nth-child(${row}) > td:nth-child(${column}) > ${element}`).toMatchSnapshot();
  };

  it('should list the last activity log entries', () => {
    cy.get('tr').should('have.length.at.least', 10);
    checkCells(1, 1, 'span');
    checkCells(1, 2, 'span');
    checkCells(1, 3, ' div > div:nth-child(1)');
    checkCells(2, 1, 'span');
    checkCells(2, 2, 'span');
    checkCells(2, 3, ' div > div:nth-child(1)');
  });

  it('should filter by user', () => {
    cy.clearAndType('input[name=username]', 'editor');
    cy.contains('Updated user');
    cy.get('tr').should('have.length.at.most', 5);
  });

  it('should show a tooltip with the detail of an activity entry', () => {
    cy.get('input[name=username]').clear();
    cy.contains('admin');
    cy.get('tr:nth-child(1) td:nth-child(3)').within(() => {
      cy.contains('Updated user').invoke('show').trigger('mouseenter');
    });
    cy.get('tr:nth-child(1) td:nth-child(3) [data-testid=flowbite-tooltip]')
      .should('be.visible')
      .invoke('text')
      .should('match', /Query{}Body{.+"username":"editor".+"email":"editor@uwazi.com"}/);
    cy.get('tr:nth-child(1) td:nth-child(3)').within(() => {
      cy.contains('Updated user').trigger('mouseleave');
    });
  });

  it('should update the list when filters are cleaned', () => {
    cy.get('tr').should('have.length.at.least', 10);
  });

  it('should open the detail of an entry', () => {
    cy.get('input[name=username]').clear();
    cy.get('tr:nth-child(1) td:nth-child(5)').contains('View').click();
    cy.get('aside').eq(0).toMatchImageSnapshot();
    cy.get('[data-testid=close-sidepanel]').click();
  });

  it('should filter by method', () => {
    cy.clearAndType('input[name=search]', 'DELETE');
    cy.contains('editor');
    cy.get('tr').should('have.length.at.most', 3);
  });

  it('should filter by dates', () => {
    cy.get('input[name=search]').clear();
    cy.get('input[name=start]').type('2023-06-21', { delay: 0 });
    cy.get('input[name=end]').clear();
    cy.get('input[name=end]').type('2023-06-24', { delay: 0 });
    cy.contains('admin');
    cy.get('tr').should('have.length.at.most', 2);
  });
});
