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
    cy.clearAndType('input[name=email]', 'editor@uwazi.com', { delay: 0 });
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

  const applyFilters = () => {
    cy.intercept('GET', 'api/activityLog*').as('getActivityLog');
    cy.contains('button', 'Apply').click();
    cy.wait('@getActivityLog');
    cy.contains('button', 'Apply').should('not.exist');
  };

  it('should filter by user', () => {
    cy.contains('button', 'Filters').click();
    cy.contains('Apply');
    cy.get('input[name=username]').type('editor', { delay: 0 });
    applyFilters();
    cy.contains('Updated user');
    cy.get('tr').should('have.length.at.most', 5);
  });

  it('should show a tooltip with the detail of an activity entry', () => {
    cy.contains('button', 'Filters').click();

    applyFilters();
    cy.contains('RAW').should('not.exist');
    cy.get('tr:nth-child(1) td:nth-child(3)').within(() => {
      cy.contains('Updated user').invoke('show').trigger('mouseenter');
    });
    cy.get('tr:nth-child(1) td:nth-child(3)').within(() => {
      cy.contains('Updated user').invoke('show').trigger('mouseenter');
    });
    cy.contains('Body');
    cy.get('tr:nth-child(1) td:nth-child(3) [data-testid=flowbite-tooltip]')
      .should('be.visible')
      .invoke('text')
      .should('match', /Query{}Body{.+"username":"editor".+"email":"editor@uwazi.com"}/);
    cy.get('tr:nth-child(1) td:nth-child(3)').within(() => {
      cy.contains('Updated user').trigger('mouseleave');
    });
  });

  it('should update the list when filters are cleaned', () => {
    cy.contains('button', 'Filters').click();
    cy.contains('button', 'Clear all').click();
    applyFilters();
    cy.get('tr').should('have.length.at.least', 10);
  });

  it('should open the detail of an entry', () => {
    cy.contains('Updated user');
    cy.get('tr:nth-child(1) td:nth-child(5)').contains('View').click();
    cy.contains('Query', { timeout: 200 });
    cy.get('aside.ease-in').toMatchSnapshot();
    cy.get('[data-testid=close-sidepanel]').click();
  });

  const selectMethod = (option: number) => {
    cy.getByTestId('multiselect').within(() => {
      cy.get('button').eq(0).click();
      cy.get('ul li')
        .eq(option)
        .within(() => {
          cy.get('input').eq(0).click();
        });
    });
  };

  it('should filter by method', () => {
    cy.contains('button', 'Filters').click();
    selectMethod(2);
    applyFilters();
    cy.contains('editor');
    cy.get('tr').should('have.length.at.most', 3);
  });

  it('should filter by dates', () => {
    cy.contains('button', 'Filters').click();
    cy.contains('button', 'Clear all').click();
    applyFilters();
    cy.contains('button', 'Filters').click();
    cy.get('input[name=from]').type('2023-06-21', { delay: 0 });
    cy.get('input[name=to]').clear();
    cy.get('input[name=to]').type('2023-06-24', { delay: 0 });
    applyFilters();
    cy.get('tr').should('have.length.at.most', 2);
  });

  it('should do a composed filter', () => {
    cy.contains('button', 'Filters').click();
    cy.contains('button', 'Clear all').click();
    cy.clearAndType('input[name=username]', 'admin', { delay: 0 });
    cy.clearAndType('input[name=search]', 'new user', { delay: 0 });
    selectMethod(0);
    cy.get('input[name=from]').type('2023-06-22', { delay: 0 });
    cy.clearAndType('input[name=to]', '2023-06-22', { delay: 0 });
    applyFilters();
    cy.get('tr').should('have.length', 2);
    cy.contains('Cynthia');
  });
});
