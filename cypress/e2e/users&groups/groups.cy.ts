import { clearCookiesAndLogin } from '../helpers/login';
import 'cypress-axe';

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

  //   it('should be sorted by name by default', () => {
  //     const groups = ['Activistas', 'Asesores legales'];

  //     cy.get('table tbody tr').each((row, index) => {
  //       cy.wrap(row).within(() => {
  //         cy.get('td').eq(1).should('contain.text', groups[index]);
  //       });
  //     });
  //   });

  //   it('create group', () => {
  //     cy.contains('button', 'Add group').click();
  //     cy.get('aside').within(() => {
  //       cy.get('#name').type('Group_1');
  //       cy.get('[data-testid="multiselect-comp"]').within(() => {
  //         cy.get('button').click();
  //         cy.get('ul li')
  //           .eq(0)
  //           .within(() => {
  //             cy.get('input').eq(0).click();
  //           });
  //       });
  //       cy.contains('button', 'Save').click();
  //     });
  //   });

  //   it('edit group');

  //   it('delete group');

  //   it('check for unique name');
});
