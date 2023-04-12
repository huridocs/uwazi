const clearCookiesAndLogin = (username?: string, password?: string) => {
  cy.clearAllCookies();
  cy.visit('http://localhost:3000/login');
  cy.get('a[aria-label="Sign in"]').click();
  cy.get('input[name="username"').type(username || 'admin');
  cy.get('input[name="password"').type(password || 'admin');
  cy.get('button[type="submit"').click();
};

export { clearCookiesAndLogin };
