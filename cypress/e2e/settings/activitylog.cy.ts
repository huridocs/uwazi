import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers/index.js';
import { logA11yViolations } from '../../support/helpers/a11y.js';

const closeModalIfOpen = () => {
  cy.get('body').then($body => {
    if ($body.find('.ReactModal__Overlay').length > 0) {
      cy.get('body').type('{esc}', { force: true });
    }
  });
};

describe('Activity log', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin('editor', 'editor');
  });

  it('should register entity creation in activity log', () => {
    cy.contains('a', 'Library').click();
    cy.contains('Create entity').click();
    cy.get('#metadataForm select').select('Reporte');
    cy.contains('Title').scrollIntoView();
    cy.get('textarea[name="library.sidepanel.metadata.title"]:not([disabled])').type('AL Report');
    cy.get('[data-testid="metadata-sidepanel"].is-active').contains('button', 'Save').click();
    cy.contains('Entity created');
  });

  it('should register entity edition in activity log', () => {
    cy.contains('div.item-document', 'AL Report').click();
    cy.contains('.metadata-sidepanel.is-active .edit-metadata', 'Edit').click();
    cy.get('#metadataForm select').eq(0).select('Reporte');
    cy.contains('Title').scrollIntoView();
    cy.clearAndType(
      'textarea[name="library.sidepanel.metadata.title"]:not([disabled])',
      'Report AL'
    );
    cy.get('[data-testid="metadata-sidepanel"].is-active').contains('button', 'Save').click();
    cy.contains('Entity updated');
  });

  it('should register entity deletion in activity log', () => {
    cy.contains('div.item-document', 'Report AL', { timeout: 200 }).click();
    cy.get('[data-testid="metadata-sidepanel"].is-active').contains('button', 'Delete').click();
    cy.contains('.confirm-button', 'Accept').click({ force: true });
    cy.contains('Entity deleted');
  });

  it('should register account edition in activity log', () => {
    closeModalIfOpen();
    cy.get('.only-desktop a[aria-label="Settings"]').click({ force: true });
    cy.contains('span', 'Account').click({ force: true });
    cy.contains('button', 'Enable').click({ force: true });
    cy.get('[data-testid="modal"]').within(() => {
      cy.contains('button', 'Cancel').click({ force: true });
    });
    cy.get('input[name=email]').clear({ force: true });
    cy.get('input[name=email]').type('editor@uwazi.com', {
      force: true,
      delay: 0,
    });
    cy.contains('button', 'Update').click({ force: true });
    cy.get('[data-testid="modal"]').within(() => {
      cy.get('input').type('editor');
      cy.contains('button', 'Accept').click({ force: true });
    });
  });

  it('should pass accessibility check', () => {
    clearCookiesAndLogin();
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.contains('span', 'Activity log').click();
    cy.contains('editor');
    cy.injectAxe();
    cy.checkA11y(undefined, undefined, logA11yViolations);
  });

  it('should list the last activity log entries', () => {
    cy.get('tr').should('have.length.at.least', 4);
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
    cy.contains('td', 'editor');
    cy.get('tr').should('have.length.at.most', 6);
  });

  it('should show a tooltip with the detail of an activity entry', () => {
    cy.contains('button', 'Filters').click();

    applyFilters();
    cy.contains('RAW').should('not.exist');
    cy.get('table tbody tr td:nth-child(3)').first().invoke('show').trigger('mouseenter');
    cy.get('[data-testid=flowbite-tooltip]').should('have.length.at.least', 1);
    cy.get('table tbody tr td:nth-child(3)').first().trigger('mouseleave');
  });

  it('should update the list when filters are cleaned', () => {
    cy.contains('button', 'Filters').click();
    cy.contains('button', 'Clear all').click();
    applyFilters();
    cy.get('tr').should('have.length.at.least', 4);
  });

  it('should open the detail of an entry', () => {
    cy.get('table tbody tr').first().contains('button, a', 'View').click({ force: true });
    cy.contains('Query', { timeout: 200 });
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
    cy.contains('button', 'Filters').click({ force: true });
    selectMethod(2);
    applyFilters();
    cy.contains('editor');
    cy.get('tr').should('have.length.at.most', 3);
  });

  it('should filter by dates', () => {
    cy.contains('button', 'Filters').click({ force: true });
    cy.contains('button', 'Clear all').click({ force: true });
    applyFilters();
    cy.contains('button', 'Filters').click({ force: true });
    cy.get('#from').type('2024-04-25', { delay: 0 });
    cy.get('#to').clear();
    cy.get('#to').type('2024-05-09', { delay: 0 });
    cy.get('#to').realPress('Tab');
    applyFilters();
    cy.get('tr').should('have.length.at.most', 5);
  });

  // eslint-disable-next-line max-statements
  it('should do a composed filter with search', () => {
    cy.contains('button', 'Filters').click({ force: true });
    cy.contains('button', 'Clear all').click({ force: true });
    cy.clearAndType('input[name=username]', 'editor', { delay: 0 });
    cy.clearAndType('input[name=search]', 'Deleted entity', { delay: 0 });
    selectMethod(2);
    cy.get('#from').type('2024-05-28', { delay: 0 });
    cy.get('#to').click();
    cy.get('.datepicker:not(.hidden) .datepicker-controls .today-btn').eq(1).click();
    applyFilters();
    cy.get('tr').should('have.length', 2);
    cy.contains('Deleted entity');
  });

  // eslint-disable-next-line max-statements
  it('should do a composed filter with today', () => {
    cy.contains('button', 'Filters').click({ force: true });
    cy.contains('button', 'Clear all').click({ force: true });
    cy.clearAndType('input[name=username]', 'editor', { delay: 0 });
    selectMethod(0);
    cy.get('#from').type('2024-05-28', { delay: 0 });
    cy.get('#to').click();
    cy.get('.datepicker:not(.hidden) .datepicker-controls .today-btn').eq(1).click();
    applyFilters();
    cy.get('tr').should('have.length.at.least', 2);
    cy.contains('td', 'Created entity:');
    cy.contains('td', 'AL Report');
  });
});
