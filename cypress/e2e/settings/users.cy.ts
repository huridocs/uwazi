/* eslint-disable max-lines */
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
    cy.contains('button', 'Users').click();
    cy.injectAxe();
  });

  it('accesibility check', () => {
    cy.get('caption').within(() => cy.contains('span', 'Users'));
    cy.get('div.tw-content').scrollTo('top');
    cy.checkA11y();
    cy.getByTestId('settings-content').toMatchImageSnapshot();
    cy.contains('button', 'Add user').click();
    cy.contains('h1', 'New user');
    cy.get('aside').toMatchImageSnapshot();
    cy.checkA11y();
    cy.contains('button', 'Cancel').click();
  });

  it('should be sorted by name by default', () => {
    const titles = ['Carmen', 'Cynthia', 'Mike', 'admin', 'blocky', 'colla', 'editor'];
    namesShouldMatch(titles);
  });

  describe('actions', () => {
    it('create user', () => {
      cy.intercept('GET', '/api/users').as('updateUsers');
      cy.contains('button', 'Add user').click();
      cy.get('aside').within(() => {
        cy.get('#username').type('User_1');
        cy.get('#email').type('user@mailer.com');
        cy.get('#password').type('secret');
        cy.getByTestId('multiselect').within(() => {
          cy.get('button').click();
          cy.contains('Activistas').click();
          cy.get('button').click();
        });
      });
      cy.contains('button', 'Save').click();
      cy.contains('span', 'User_1');
      cy.wait('@updateUsers');
      cy.contains('button', 'Dismiss').click();
    });

    it('edit user', () => {
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
      });
      cy.contains('button', 'Save').click();
      cy.contains('span', 'Carmen_edited');
      cy.contains('button', 'Dismiss').click();
    });

    it('delete user', () => {
      cy.get('table tbody tr')
        .eq(3)
        .within(() => {
          cy.get('td input').eq(0).click();
        });
      cy.contains('button', 'Delete').click();
      cy.contains('[data-testid="modal"] button', 'Accept').click();
      cy.contains('span', 'User_1').should('not.exist');
      cy.contains('button', 'Dismiss').click();
    });

    it('should check the changes', () => {
      const titles = ['Carmen_edited', 'Cynthia', 'Mike', 'admin', 'blocky', 'colla', 'editor'];
      namesShouldMatch(titles);
    });
  });

  describe('form validations', () => {
    it('check for unique name and email', () => {
      cy.contains('button', 'Add user').click();
      cy.get('aside').within(() => {
        cy.get('#username').type('admin');
        cy.get('#email').type('admin@uwazi.com');
        cy.contains('button', 'Save').click();
        cy.contains('span', 'Duplicated username').should('exist');
        cy.contains('span', 'Duplicated email').should('exist');
      });
    });

    it('should check for spaces in the username', () => {
      cy.get('aside').within(() => {
        cy.get('#username').type(' some spaces');
        cy.contains('button', 'Save').click();
        cy.contains('span', 'Usernames cannot have spaces').should('exist');
      });
    });

    it('should not allow usernames that are too short or too long', () => {
      cy.get('aside').within(() => {
        cy.get('#username').clear();
        cy.get('#username').type('Al');
        cy.contains('span', 'Username is too short').should('exist');
        cy.get('#username').clear();
        cy.get('#username').type('LongNameForAUserWhatIsTheAdminThinkingWhenCreatingIt');
        cy.contains('span', 'Username is too long').should('exist');
      });
    });

    it('should not allow very long passwords', () => {
      cy.get('aside').within(() => {
        cy.get('#password').type('This passwords has more then 50 chatacters, it should fail.');
        cy.contains('span', 'Password is too long').should('exist');
      });
    });

    it('should required email', () => {
      cy.get('aside').within(() => {
        cy.get('#email').clear();
        cy.contains('span', 'Email is required').should('exist');
      });
      cy.contains('button', 'Cancel').click();
    });
  });

  describe('reset password and 2fa', () => {
    it('reset password', () => {
      cy.intercept('GET', '/api/users').as('updateUsers');
      cy.get('table tbody tr')
        .eq(0)
        .within(() => {
          cy.get('td input').eq(0).click();
        });
      cy.contains('button', 'Reset Password').click();
      cy.contains('[data-testid="modal"] button', 'Accept').click();
      cy.contains('div', 'Instructions to reset the password were sent to the user');
      cy.wait('@updateUsers');
      cy.contains('button', 'Dismiss').click();
    });

    it('Reset 2fa', () => {
      cy.intercept('GET', '/api/users').as('updateUsers');
      cy.contains('span', 'Password + 2fa');
      cy.get('table tbody tr')
        .eq(4)
        .within(() => {
          cy.get('td input').eq(0).click();
        });
      cy.contains('button', 'Reset 2FA').click();
      cy.contains('[data-testid="modal"] button', 'Accept').click();
      cy.get('table tbody tr')
        .eq(4)
        .within(() => {
          cy.contains('span', 'Password + 2fa').should('not.exist');
        });
      cy.wait('@updateUsers');
      cy.contains('button', 'Dismiss').click();
    });
  });

  describe('unblock user', () => {
    it('should unblock a user', () => {
      cy.intercept('GET', '/api/users').as('updateUsers');
      cy.get('table tbody tr')
        .eq(4)
        .within(() => {
          cy.get('td:nth-child(6) button').click();
        });

      cy.contains('button', 'Unlock account').click();
      cy.wait('@updateUsers');
    });

    it('should log in with the unblocked user', () => {
      cy.contains('a', 'Account').click();
      clearCookiesAndLogin('blocky', '1234');
      cy.contains('a', 'Settings').click();
      cy.contains('a', 'Account').click();
      cy.get('#account-username').should('have.value', 'blocky');
    });
  });

  describe('bulk actions', () => {
    it('should log back in as admin', () => {
      clearCookiesAndLogin();
      cy.get('.only-desktop a[aria-label="Settings"]').click();
      cy.contains('span', 'Users & Groups').click();
      cy.contains('button', 'Users').click();
    });

    it('bulk password reset', () => {
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
      cy.contains('button', 'Reset Password').click();
      cy.getByTestId('modal').within(() => {
        cy.contains('h1', 'Reset passwords');
        cy.contains('li', 'Carmen_edited');
        cy.contains('li', 'Cynthia');
        cy.contains('button', 'Accept').click();
      });
      cy.contains('div', 'Instructions to reset the password were sent to the user');
      cy.contains('button', 'Dismiss').click();
    });

    it('bulk reset 2FA', () => {
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
      cy.contains('button', 'Reset 2FA').click();
      cy.getByTestId('modal').within(() => {
        cy.contains('h1', 'Reset 2FA');
        cy.contains('li', 'Carmen_edited');
        cy.contains('li', 'Mike');
        cy.contains('button', 'Accept').click();
      });
      cy.get('table tbody tr')
        .eq(0)
        .within(() => {
          cy.contains('span', 'Password + 2fa').should('not.exist');
        });
      cy.get('table tbody tr')
        .eq(1)
        .within(() => {
          cy.contains('span', 'Password + 2fa');
        });
      cy.get('table tbody tr')
        .eq(2)
        .within(() => {
          cy.contains('span', 'Password + 2fa').should('not.exist');
        });
      cy.contains('button', 'Dismiss').click();
    });

    it('bulk delete', () => {
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
      cy.getByTestId('modal').within(() => {
        cy.contains('h1', 'Delete');
        cy.contains('li', 'Carmen_edited');
        cy.contains('li', 'Mike');
        cy.contains('button', 'Accept').click();
      });
      cy.contains('span', 'Carmen_edited').should('not.exist');
      cy.contains('span', 'Mike').should('not.exist');
      cy.contains('button', 'Dismiss').click();
      namesShouldMatch(['Cynthia', 'admin', 'blocky', 'colla', 'editor']);
    });
  });
});
