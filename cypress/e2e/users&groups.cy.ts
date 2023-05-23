import 'cypress-axe';
import { clearCookiesAndLogin } from './helpers';

describe('Users and groups', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    // cy.exec('yarn e2e-puppeteer-fixtures', { env });
    clearCookiesAndLogin();
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.contains('span', 'Users & Groups').click();
    cy.injectAxe();
  });

  describe('Users', () => {
    it('should be sorted by name by default', () => {
      const titles = ['admin', 'colla', 'editor'];
      cy.get('table tbody tr').each((row, index) => {
        cy.wrap(row).within(() => {
          cy.get('td').eq(1).should('contain.text', titles[index]);
        });
      });
    });
    it('create user', () => {
      cy.contains('button', 'Add user').click();
      cy.get('aside').within(() => {
        cy.get('#username').type('User 1');
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
        cy.get('[data-testid="Close sidepanel"]').click();

        // ---remove below after implementing form submission ----
        cy.get('[role="dialog"] button').click();

        // ----- use below after implementing ------
        // const titles = ['admin', 'colla', 'editor', 'User 1'];
        // cy.get('table tbody tr').each((row, index) => {
        //   cy.wrap(row).within(() => {
        //     cy.get('td').eq(1).should('contain.text', titles[index]);
        //   });
        // });
      });
    });
    it('edit user', () => {
      cy.get('table tbody tr')
        .eq(0)
        .within(() => {
          cy.get('td:nth-child(6) button').click();
        });
      cy.get('aside').within(() => {
        cy.get('#username').should('have.value', 'admin');
        cy.get('#email').should('have.value', 'admin@uwazi.com');
        cy.get('#username').type(' edited');
        cy.contains('button', 'Save').click();
        cy.get('[data-testid="Close sidepanel"]').click();

        const titles = ['admin', 'colla', 'editor', 'User 1'];
        cy.get('table tbody tr').each((row, index) => {
          cy.wrap(row).within(() => {
            cy.get('td').eq(1).should('contain.text', titles[index]);
          });
        });
      });
    });
    it('delete user');
    it('reset password');
    it('disable 2fa');
    it('check for unique name and email');

    describe('bulk actions', () => {
      it('bulk delete');
      it('bulk password reset');
      it('bulk reset 2FA');
    });
  });

  describe('Groups', () => {
    it('should be sorted by name by default');
    it('create group');
    it('edit group');
    it('delete group');
    it('check for unique name');
  });
});
