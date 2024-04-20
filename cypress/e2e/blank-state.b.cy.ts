import 'cypress-axe';
import { clearCookiesAndLogin } from './helpers';

before(() => {
  const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
  cy.exec('yarn blank-state --force', { env });
});

it('should login with blank-state credentials', () => {
  clearCookiesAndLogin('admin', 'change this password now');
});
