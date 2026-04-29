import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers/login.js';
import { logA11yViolations } from '../../support/helpers/a11y.js';

const namesShouldMatch = (names: string[]) => {
  cy.get('table tbody tr').each((row, index) => {
    cy.wrap(row).within(() => {
      cy.get('td').eq(1).should('contain.text', names[index]);
    });
  });
};

describe('Groups', () => {
  afterEach(() => {
    cy.get('body').then($body => {
      if ($body.find('[data-testid="sidepanel-overlay"]').length) {
        cy.get('[data-testid="close-sidepanel"]').click({ force: true });
      }
    });
  });

  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin();
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.contains('span', 'Users & Groups').click();
    cy.contains('button', 'Groups').click();
    cy.injectAxe();
  });

  it('accesibility check', () => {
    cy.get('[data-testid=table-header]').within(() => cy.contains('span', 'Groups'));
    cy.checkA11y(undefined, undefined, logA11yViolations);
    cy.contains('button', 'Users').should('be.visible');
    cy.contains('button', 'Groups').should('be.visible');
    cy.get('table thead').within(() => {
      cy.contains('th', 'Name');
      cy.contains('th', 'Members');
    });
    cy.get('table tbody tr').should('have.length', 2);
    cy.contains('tr', 'Activistas').within(() => {
      cy.contains('span', 'admin');
      cy.contains('span', 'editor');
      cy.contains('span', 'Cynthia');
      cy.contains('button', 'Edit');
    });
    cy.contains('tr', 'Asesores legales').within(() => {
      cy.contains('span', 'editor');
      cy.contains('span', 'colla');
      cy.contains('span', 'Cynthia');
      cy.contains('button', 'Edit');
    });
    cy.contains('button', 'Add group').should('be.visible');
    cy.contains('button', 'Add group').click();
    cy.contains('h1', 'New group');
    cy.checkA11y(undefined, undefined, logA11yViolations);
    cy.get('[data-testid="group-sidepanel-snapshot"]').matchImageSnapshot('sidepanel', {
      blur: 2,
      failureThreshold: 0.18,
      failureThresholdType: 'percent',
      allowSizeMismatch: true,
    });
    cy.get('[data-testid="close-sidepanel"]').click();
  });

  it('should be sorted by name by default', () => {
    const groups = ['Activistas', 'Asesores legales'];
    namesShouldMatch(groups);
  });

  it('should create group', () => {
    cy.intercept('GET', '/api/usergroups').as('fetchUserGroups');
    cy.contains('button', 'Add group').click();
    cy.get('aside').within(() => {
      cy.get('#name').type('Group One', { delay: 0 });
      cy.getByTestId('multiselect').within(() => {
        cy.get('button').click();
        cy.get('ul li')
          .eq(0)
          .within(() => {
            cy.get('input').eq(0).click();
          });
      });
      cy.contains('button', 'Save').click();
    });

    const groups = ['Activistas', 'Asesores legales', 'Group One'];
    cy.wait('@fetchUserGroups');
    namesShouldMatch(groups);
  });

  it('should edit group', () => {
    cy.contains('button', 'Edit').eq(0).click({ force: true });
    cy.clearAndType('input[id=name]', 'Knights of the Zodiac', { delay: 0 });
    cy.getByTestId('multiselect').within(() => {
      cy.get('button').eq(0).click();
      cy.get('ul li')
        .eq(0)
        .within(() => {
          cy.get('input').eq(0).click();
        });
      cy.get('button').eq(0).click();
      cy.get('button').eq(1).click();
    });
    cy.contains('button', 'Save').click();

    cy.contains('td', 'Knights of the Zodiac');
    cy.get('tbody > :nth-child(3) > :nth-child(3)').within(() => {
      cy.getByTestId('pill-comp').eq(0).contains('span', 'Cynthia');
    });

    const groups = ['Asesores legales', 'Group One', 'Knights of the Zodiac'];
    namesShouldMatch(groups);
  });

  it('check for unique name', () => {
    cy.contains('button', 'Edit').eq(0).click();
    cy.clearAndType('input[id=name]', 'Group One', { delay: 0 });
    cy.contains('button', 'Save').click();
    cy.contains('p', 'Duplicated name');

    cy.clearAndType('input[id=name]', 'Group Two', { delay: 0 });
    cy.contains('button', 'Save').click();
    cy.contains('td', 'Group Two');
  });

  it('should delete two groups', () => {
    cy.get('table tbody tr')
      .eq(0)
      .within(() => {
        cy.get('td input').eq(0).click();
      });

    cy.get('table tbody tr')
      .eq(2)
      .within(() => {
        cy.get('td input').eq(0).click();
      });

    cy.contains('button', 'Delete').click();
    cy.contains('span', 'Do you want to delete the following items?');
    cy.contains('li', 'Knights of the Zodiac');
    cy.contains('li', 'Group One');

    cy.contains('button', 'Accept').click();
  });

  it('should check that the groups are deleted', () => {
    cy.contains('td', 'Group Two');
    cy.contains('td', 'Knights of the Zodiac').should('not.exist');
    cy.contains('td', 'Group One').should('not.exist');
  });
});
