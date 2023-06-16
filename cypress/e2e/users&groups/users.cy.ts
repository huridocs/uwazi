import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers';

const namesShouldMatch = (names: string[]) => {
  cy.get('table tbody tr').each((row, index) => {
    cy.wrap(row).within(() => {
      cy.get('td').eq(1).should('contain.text', names[index]);
    });
  });
};

describe('Users', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-puppeteer-fixtures', { env });
    clearCookiesAndLogin();
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.contains('span', 'Users & Groups').click();
    cy.injectAxe();
  });

  it('should be sorted by name by default', () => {
    const titles = ['Carmen', 'Mike', 'admin', 'blocky', 'colla', 'editor'];
    namesShouldMatch(titles);
  });

  it('create user', () => {
    cy.contains('button', 'Add user').click();
    cy.get('aside').within(() => {
      cy.get('#username').type('User_1');
      cy.get('#email').type('user@mailer.com');
      cy.get('#password').type('secret');
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
    cy.contains('span', 'Account').click();
    cy.contains('span', 'Users & Groups').click();

    namesShouldMatch(['Carmen', 'Mike', 'User_1', 'admin', 'blocky', 'colla', 'editor']);
  });

  it('edit user', () => {
    cy.intercept('POST', 'api/users').as('editUser');
    cy.get('table tbody tr')
      .eq(0)
      .within(() => {
        cy.get('td:nth-child(6) button').click();
      });
    cy.get('aside').within(() => {
      cy.get('#username').should('have.value', 'Carmen');
      cy.get('#email').should('have.value', 'carmen@huridocs.org');
      cy.get('#username').type('_edited');
      cy.get('#password').type('secret');
      cy.contains('button', 'Save').click();
    });
    cy.wait('@editUser');
    const titles = ['Carmen_edited', 'Mike', 'User_1', 'admin', 'blocky', 'colla', 'editor'];
    namesShouldMatch(titles);
  });

  it('delete user', () => {
    cy.intercept('DELETE', 'api/users*').as('deleteUser');
    cy.get('table tbody tr')
      .eq(2)
      .within(() => {
        cy.get('td input').eq(0).click();
      });
    cy.contains('button', 'Dismiss').click();
    cy.contains('button', 'Delete').click();
    cy.contains('[data-testid="modal"] button', 'Accept').click();
    cy.contains('button', 'Dismiss').click();
    cy.wait('@deleteUser');
    cy.contains('span', 'Account').click();
    cy.contains('span', 'Users & Groups').click();
    const titles = ['Carmen_edited', 'Mike', 'admin', 'blocky', 'colla', 'editor'];
    namesShouldMatch(titles);
  });

  it('reset password', () => {
    cy.reload();
    cy.get('table tbody tr')
      .eq(0)
      .within(() => {
        cy.get('td input').eq(0).click();
      });
    cy.contains('button', 'Reset Password').click();
    cy.contains('[data-testid="modal"] button', 'Accept').click();
    cy.contains('button', 'Dismiss').click();
  });
  it('Reset 2fa', () => {
    cy.get('table tbody tr')
      .eq(0)
      .within(() => {
        cy.get('td input').eq(0).click();
      });
    cy.contains('button', 'Reset 2FA').click();
    cy.contains('[data-testid="modal"] button', 'Accept').click();
  });
  it('check for unique name and email');

  describe('bulk actions', () => {
    it('bulk delete', () => {
      cy.reload();
      cy.intercept('DELETE', 'api/users*').as('deleteUsers');
      cy.get('table tbody tr')
        .eq(0)
        .within(() => {
          cy.get('td input').eq(0).click();
        });
      cy.get('table tbody tr')
        .eq(1)
        .within(() => {
          cy.get('td input').eq(0).click();
        });
      cy.contains('button', 'Delete').click();
      cy.contains('[data-testid="modal"] button', 'Accept').click();
      cy.contains('button', 'Dismiss').click();
      cy.wait('@deleteUsers');
      cy.reload();
      namesShouldMatch(['admin', 'blocky', 'colla', 'editor']);
    });
    it('bulk password reset');
    it('bulk reset 2FA');
  });
});
