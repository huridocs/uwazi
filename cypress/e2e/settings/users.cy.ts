/* eslint-disable max-lines */
import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers/index.js';
import { logA11yViolations } from '../../support/helpers/a11y.js';

const axeUsersFormRules = { rules: { 'autocomplete-valid': { enabled: false } } };

const goToUsersTab = () => {
  cy.get('nav[aria-label="Settings navigation"] a[href*="settings/users"]').click();
  cy.contains('[role="tab"]', 'Users').click();
};

const namesShouldMatch = (names: string[]) => {
  cy.get('table tbody tr').each((row, index) => {
    cy.wrap(row).within(() => {
      cy.get('td').eq(1).should('contain.text', names[index]);
    });
  });
};

const closeUserSidepanelIfOpen = () => {
  cy.get('body').then($body => {
    const openSidepanel = $body
      .find('aside .sidepanel-footer button')
      .filter(':contains("Cancel")');
    if (openSidepanel.length > 0) {
      cy.wrap(openSidepanel.first()).click({ force: true });
    }
  });
};

describe('Users', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin();
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    goToUsersTab();
    cy.injectAxe();
  });

  it('accesibility check', () => {
    cy.get('[data-testid=table-header]').within(() => cy.contains('span', 'Users'));
    cy.checkA11y(undefined, axeUsersFormRules, logA11yViolations);
    cy.contains('button', 'Add user').click({ force: true });
    cy.contains('h1', 'New user');
    cy.checkA11y(undefined, axeUsersFormRules, logA11yViolations);
    cy.contains('button', 'Cancel').click();
  });

  it('should be sorted by name by default', () => {
    const titles = ['Carmen', 'Cynthia', 'Mike', 'admin', 'blocky', 'colla', 'editor'];
    namesShouldMatch(titles);
  });

  describe('actions', () => {
    it('create user', () => {
      cy.intercept('GET', '/api/users').as('updateUsers');
      cy.contains('button', 'Add user').click({ force: true });
      cy.get('aside').within(() => {
        cy.get('#username').type('User_1', { delay: 0 });
        cy.get('#email').type('user@mailer.com', { delay: 0 });
        cy.get('#password').type('secret', { delay: 0 });
        cy.getByTestId('multiselect').scrollIntoView();
        cy.getByTestId('multiselect').within(() => {
          cy.get('button').click();
          cy.contains('Activistas').click();
        });
      });
      cy.contains('button', 'Save').click();
      cy.get('[data-testid="modal"]').within(() => {
        cy.get('input').type('admin', { delay: 0 });
        cy.get('[data-testid="accept-button"]').click({ force: true });
      });
      cy.contains('span', 'User_1');
      cy.wait('@updateUsers');
    });

    it('edit user', () => {
      cy.contains('tr', 'Carmen').scrollIntoView();
      cy.contains('tr', 'Carmen').within(() => {
        cy.contains('button', 'Edit').click();
      });
      cy.get('aside').within(() => {
        cy.get('#username').should('have.value', 'Carmen');
        cy.get('#email').should('have.value', 'carmen@huridocs.org');
        cy.get('#username').type('_edited', { delay: 0 });
        cy.get('#password').type('secret', { delay: 0 });
      });
      cy.contains('button', 'Save').click();
      cy.get('[data-testid="modal"]').within(() => {
        cy.get('input').type('admin', { delay: 0 });
        cy.get('[data-testid="accept-button"]').click({ force: true });
      });
      cy.contains('span', 'Carmen_edited');
    });

    it('delete user', () => {
      cy.intercept('GET', '/api/users').as('updateUsers');
      cy.contains('td', 'User_1').siblings().first().click();
      cy.contains('button', 'Delete').click();
      cy.get('[data-testid="modal"]').within(() => {
        cy.contains('li', 'User_1');
        cy.get('input').type('admin', { delay: 0 });
        cy.get('[data-testid="accept-button"]').click({ force: true });
      });
      cy.wait('@updateUsers');
      cy.contains('span', 'User_1').should('not.exist');
    });

    it('should check accessibility on the table', () => {
      cy.checkA11y(undefined, axeUsersFormRules, logA11yViolations);
    });

    it('should check the changes and the password change for the modified user', () => {
      namesShouldMatch(['Carmen_edited', 'Cynthia', 'Mike', 'admin', 'blocky', 'colla', 'editor']);
      clearCookiesAndLogin('User_1', 'does not matter it was deleted');
      cy.contains('span', 'Login failed');
      cy.get('input[name="username"]').clear();
      cy.get('input[name="password"]').clear();
      cy.get('input[name="username"]').type('Carmen_edited', { delay: 0 });
      cy.get('input[name="password"]').type('secret', { delay: 0 });
      cy.get('button[type="submit"').click();
      cy.contains('Return to login').click();
    });
  });

  describe('form validations', () => {
    before(() => {
      clearCookiesAndLogin();
      cy.get('.only-desktop a[aria-label="Settings"]').click();
      goToUsersTab();
    });

    it('check for unique name and email', () => {
      cy.contains('button', 'Add user').click({ force: true });
      cy.get('aside').within(() => {
        cy.get('#username').type('admin', { delay: 0 });
        cy.get('#email').type('admin@uwazi.com', { delay: 0 });
        cy.contains('button', 'Save').click();
        cy.contains('span', 'Duplicated username').should('exist');
        cy.contains('span', 'Duplicated email').should('exist');
      });
    });

    it('should check for spaces in the username', () => {
      cy.get('aside').within(() => {
        cy.get('#username').type(' some spaces', { delay: 0 });
        cy.contains('button', 'Save').click();
        cy.contains('span', 'Usernames cannot have spaces').should('exist');
      });
    });

    it('should not allow usernames that are too short or too long', () => {
      cy.get('aside').within(() => {
        cy.get('#username').clear();
        cy.get('#username').type('Al');
        cy.contains('button', 'Save').click();
        cy.contains('span', 'Username is too short').should('exist');
        cy.get('#username').clear();
        cy.get('#username').type('LongNameForAUserWhatIsTheAdminThinkingWhenCreatingIt', {
          delay: 0,
        });
        cy.contains('button', 'Save').click();
        cy.contains('span', 'Username is too long').should('exist');
      });
    });

    it('should not allow very long passwords', () => {
      cy.get('aside').within(() => {
        cy.get('#password').type('This passwords has more then 50 chatacters, it should fail.', {
          delay: 0,
        });
        cy.contains('button', 'Save').click();
        cy.contains('span', 'Password is too long').should('exist');
      });
    });

    it('should required email', () => {
      cy.get('aside').within(() => {
        cy.get('#email').clear();
        cy.contains('button', 'Save').click();
        cy.contains('span', 'A valid email is required').should('exist');
      });
      cy.contains('button', 'Cancel').click();
    });
  });

  describe('reset password and 2fa', () => {
    it('reset password', () => {
      cy.intercept('GET', '/api/users').as('updateUsers');

      cy.contains('td', 'Carmen_edited').siblings().first().click();

      cy.contains('button', 'Reset Password').click();
      cy.get('[data-testid="modal"] [data-testid="accept-button"]').click({ force: true });
      cy.contains('div', 'Instructions to reset the password were sent to the user');
      cy.wait('@updateUsers');
    });

    it('Reset 2fa', () => {
      cy.intercept('GET', '/api/users').as('updateUsers');
      cy.contains('span', 'Password + 2fa');

      cy.contains('td', 'blocky').siblings().first().click();

      cy.contains('button', 'Reset 2FA').click();
      cy.get('[data-testid="modal"]').within(() => {
        cy.contains('li', 'blocky');
        cy.get('input').type('admin', { delay: 0 });
        cy.get('[data-testid="accept-button"]').click({ force: true });
      });

      cy.get('table tbody tr')
        .eq(4)
        .within(() => {
          cy.contains('span', 'Password + 2fa').should('not.exist');
        });
      cy.wait('@updateUsers');
    });
  });

  describe('unblock user', () => {
    it('should not be able to ublock a user if the password is incorrect', () => {
      cy.intercept('POST', '/api/users/unlock').as('unlockUser');
      cy.contains('td', 'blocky').siblings().contains('button', 'Edit').click({ force: true });

      cy.contains('button', 'Unlock account').click();

      cy.get('[data-testid="modal"]').within(() => {
        cy.contains('Confirm action');
        cy.get('input').type('wroooong!', { delay: 0 });
        cy.get('[data-testid="accept-button"]').click({ force: true });
      });

      cy.wait('@unlockUser').its('response.statusCode').should('be.oneOf', [401, 403]);
      cy.contains('button', 'Unlock account').should('exist');
    });

    it('should unblock a user', () => {
      cy.intercept('GET', '/api/users').as('updateUsers');

      cy.contains('button', 'Unlock account').click();

      cy.get('[data-testid="modal"]').within(() => {
        cy.contains('Confirm action');
        cy.get('input').type('admin', { delay: 0 });
        cy.get('[data-testid="accept-button"]').click({ force: true });
      });

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

  describe('change roles', () => {
    before(() => {
      clearCookiesAndLogin();
      cy.get('.only-desktop a[aria-label="Settings"]').click();
      goToUsersTab();
    });

    it('should make a collaborator user into an admin', () => {
      cy.get(':nth-child(6) > :nth-child(6) > button').click();
      cy.get('aside').within(() => {
        cy.get('input[name="username"]').clear();
        cy.get('input[name="username"]').type('admin2', { delay: 0 });
        cy.get('input[name="password"]').type('password', { delay: 0 });
        cy.get('#roles').select('admin');
      });
      cy.contains('button', 'Save').click();
      cy.get('[data-testid="modal"]').within(() => {
        cy.get('input').type('admin', { delay: 0 });
        cy.get('[data-testid="accept-button"]').click({ force: true });
      });
    });

    it('should log in with the new admin user', () => {
      clearCookiesAndLogin('admin2', 'password');
      cy.get('.only-desktop a[aria-label="Settings"]').click();
      goToUsersTab();
    });
  });

  describe('bulk actions', () => {
    it('bulk password reset', () => {
      cy.contains('td', 'Carmen_edited').siblings().first().click();
      cy.contains('td', 'Cynthia').siblings().first().click();

      cy.contains('button', 'Reset Password').click();

      cy.getByTestId('modal').within(() => {
        cy.contains('h1', 'Reset passwords');
        cy.contains('li', 'Carmen_edited');
        cy.contains('li', 'Cynthia');
        cy.get('input').should('not.exist');
        cy.get('[data-testid="accept-button"]').click({ force: true });
      });

      cy.contains('div', 'Instructions to reset the password were sent to the user');
    });

    it('bulk reset 2FA', () => {
      cy.intercept('GET', '/api/user*').as('getUsers');

      cy.contains('td', 'Carmen_edited').siblings().first().click();
      cy.contains('td', 'Mike').siblings().first().click();

      cy.contains('button', 'Reset 2FA').click();

      cy.getByTestId('modal').within(() => {
        cy.contains('h1', 'Reset 2FA');
        cy.contains('li', 'Carmen_edited');
        cy.contains('li', 'Mike');
        cy.get('input').type('password', { delay: 0 });
        cy.get('[data-testid="accept-button"]').click({ force: true });
      });

      cy.wait('@getUsers');
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
    });

    it('bulk delete', () => {
      cy.intercept('GET', '/api/users').as('getUsers');
      cy.intercept('GET', '/api/usergroups').as('getGroups');

      cy.contains('td', 'Carmen_edited').siblings().first().click();
      cy.contains('td', 'Mike').siblings().first().click();

      cy.contains('button', 'Delete').click();

      cy.getByTestId('modal').within(() => {
        cy.contains('h1', 'Delete');
        cy.contains('li', 'Carmen_edited');
        cy.contains('li', 'Mike');
        cy.get('input').type('password', { delay: 0 });
        cy.get('[data-testid="accept-button"]').click({ force: true });
      });

      cy.wait('@getUsers');

      cy.wait('@getGroups');
      cy.contains('span', 'Carmen_edited').should('not.exist');
      cy.contains('span', 'Mike').should('not.exist');

      namesShouldMatch(['Cynthia', 'admin', 'admin2', 'blocky', 'editor']);
    });
  });

  describe('validate password', () => {
    it('should not be able to edit another user if the password is incorrect', () => {
      cy.intercept('POST', '/api/users').as('saveUser');
      goToUsersTab();
      cy.contains('td', 'Cynthia').parents('tr').contains('button', 'Edit').click({ force: true });
      cy.get('aside').should('be.visible');
      cy.get('aside').within(() => {
        cy.get('#password').type('changed password', { delay: 0 });
        cy.contains('button', 'Save').click();
      });

      cy.get('[data-testid="modal"]').within(() => {
        cy.get('input').type('theIncorrectPassword!!', { delay: 0 });
        cy.get('[data-testid="accept-button"]').click({ force: true });
      });

      cy.wait('@saveUser').its('response.statusCode').should('be.oneOf', [401, 403]);
      closeUserSidepanelIfOpen();
    });

    it('should not be able to reset 2fa if the password is incorrect', () => {
      cy.intercept('POST', '/api/auth2fa-reset').as('reset2fa');
      closeUserSidepanelIfOpen();
      cy.contains('td', 'blocky').parents('tr').contains('button', 'Edit').click({ force: true });
      cy.get('aside').should('be.visible');
      cy.get('aside').contains('button', 'Reset 2FA').click({ force: true });

      cy.get('[data-testid="modal"]').within(() => {
        cy.get('input').type('anotherWorng!!', { delay: 0 });
        cy.get('[data-testid="accept-button"]').click({ force: true });
      });

      cy.wait('@reset2fa').its('response.statusCode').should('be.oneOf', [401, 403]);
      cy.get('aside').contains('button', 'Reset 2FA').should('exist');
    });
  });
});
