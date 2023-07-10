import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers/login';

const namesShouldMatch = (names: string[]) => {
  cy.get('table tbody tr').each((row, index) => {
    cy.wrap(row).within(() => {
      cy.get('td').eq(1).should('contain.text', names[index]);
    });
  });
};

describe('Groups', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-puppeteer-fixtures', { env });
    clearCookiesAndLogin();
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.contains('span', 'Users & Groups').click();
    cy.contains('button', 'Groups').click();
    cy.injectAxe();
  });

  it('accesibility check', () => {
    cy.get('caption').within(() => cy.contains('span', 'Groups'));
    cy.checkA11y();
    cy.getByTestId('settings-content').toMatchImageSnapshot();
    cy.contains('button', 'Add group').click();
    cy.contains('h1', 'New group');
    cy.checkA11y();
    cy.get('aside').toMatchImageSnapshot();
    cy.contains('button', 'Cancel').click();
  });

  it('should be sorted by name by default', () => {
    const groups = ['Activistas', 'Asesores legales'];
    namesShouldMatch(groups);
  });

  it('should create group', () => {
    cy.contains('button', 'Add group').click();

    cy.get('aside').within(() => {
      cy.get('#name').type('Group One');
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
    namesShouldMatch(groups);
  });

  it('should edit group', () => {
    cy.contains('button', 'Edit').eq(0).click();
    cy.clearAndType('input[id=name]', 'Knights of the Zodiac');
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
      cy.getByTestId('pill-comp').eq(1).contains('span', 'admin');
      cy.getByTestId('pill-comp').eq(2).contains('span', 'editor');
    });

    const groups = ['Asesores legales', 'Group One', 'Knights of the Zodiac'];
    namesShouldMatch(groups);
  });

  it('check for unique name', () => {
    cy.contains('button', 'Edit').eq(0).click();
    cy.clearAndType('input[id=name]', 'Group One');
    cy.contains('button', 'Save').click();
    cy.contains('span', 'Duplicated name');

    cy.clearAndType('input[id=name]', 'Group Two');
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

    cy.contains('button', 'Dismiss').click();
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
