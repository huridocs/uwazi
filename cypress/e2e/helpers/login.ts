const clearCookiesAndLogin = (username?: string, password?: string) => {
  cy.clearAllCookies();
  cy.visit('http://localhost:3000/login');
  cy.get('input[name="username"').type(username || 'admin');
  cy.get('input[name="password"').type(password || 'admin');
  cy.intercept('POST', '/api/login').as('login');
  cy.get('button[type="submit"').click();
  cy.wait('@login').then(result => console.log(JSON.stringify(result)));
};

export { clearCookiesAndLogin };
