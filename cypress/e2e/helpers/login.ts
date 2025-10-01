const clearCookiesAndLogin = (username?: string, password?: string) => {
  cy.clearAllCookies();
  cy.visit('http://localhost:3000/login');
  cy.contains('Login');
  cy.get('input[name="username"').type(username || 'admin', { delay: 0 });
  cy.get('input[name="password"').type(password || 'admin', { delay: 0 });
  cy.intercept('POST', '/api/login').as('login');
  cy.get('button[type="submit"').click();
  cy.wait('@login').then((interception) => {
    console.log('Login response status:', interception.response?.statusCode);
    console.log('Login response body:', interception.response?.body);
  });
  
  // Wait for redirect to library after successful login
  cy.url().should('include', '/library', { timeout: 10000 });
};

export { clearCookiesAndLogin };
