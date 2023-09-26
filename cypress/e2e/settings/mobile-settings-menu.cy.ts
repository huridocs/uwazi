import { clearCookiesAndLogin } from '../helpers';
import 'cypress-axe';

describe('Settings mobile menu', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn blank-state', { env });
  });

  beforeEach(() => {
    cy.viewport(384, 600);
  });

  it('should login', () => {
    clearCookiesAndLogin('admin', 'change this password now');
  });

  it('should only show the menu', () => {
    cy.location().should(location => {
      expect(location.pathname).to.contain('library');
    });
    cy.get('.menu-button').click();
    cy.contains('.only-mobile a', 'Settings').click();
    cy.location().should(location => {
      expect(location.pathname).to.contain('settings');
    });
    cy.get('body').toMatchImageSnapshot();
  });

  it('should enter the account settings', () => {
    cy.intercept('api/user').as('getUser');
    cy.contains('a', 'Account').click();
    cy.wait('@getUser');
    cy.get('body').toMatchImageSnapshot();
  });

  it('should go back to the menu', () => {
    cy.contains('a', 'Navigate back').click();
    cy.get('body').toMatchImageSnapshot();
  });
});
