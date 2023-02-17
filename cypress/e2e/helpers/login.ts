const login = (username: string, password: string) => {
  cy.get('a[aria-label="Sign in"]').click();
  cy.get('input[name="username"').type(username);
  cy.get('input[name="password"').type(password);
  cy.get('button[type="submit"').click();
};

export { login };
