import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers/login';
import { namesShouldMatch } from './helpers';

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
    cy.get('div[data-testid="settings-content"]').toMatchImageSnapshot();
    cy.contains('button', 'Add group').click();
    cy.contains('h1', 'New group');
    cy.get('aside').toMatchImageSnapshot();
    cy.checkA11y();
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
      cy.get('[data-testid="multiselect-comp"]').within(() => {
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
    cy.get('[data-testid="multiselect-comp"]').within(() => {
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
      cy.get('[data-testid="pill-comp"]').eq(0).contains('span', 'admin');
      cy.get('[data-testid="pill-comp"]').eq(1).contains('span', 'editor');
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
    cy.get('input[id=0]').click();
    cy.get('input[id=2]').click();
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
