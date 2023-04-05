const createUser = (userDetails: {
  username: string;
  password: string;
  email: string;
  group: string;
}) => {
  cy.get('.only-desktop a[aria-label="Settings"]').click();
  cy.contains('a', 'Users').click();
  cy.contains('button', 'Add user').click();
  cy.get('aside').get('input[name=email]').clear().type(userDetails.email);
  cy.get('aside').get('input[name=username]').clear().type(userDetails.username);
  cy.get('aside').get('input[name=password]').clear().type(userDetails.password);
  cy.get('aside').contains('span', userDetails.group).click();
  cy.get('aside').contains('button', 'Save').click();
};

export { createUser };
