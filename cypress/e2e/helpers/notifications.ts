const waitForLegacyNotifications = () => {
  cy.get('.alert-wrapper').each(element => {
    cy.wrap(element).should('be.empty');
  });
};

export { waitForLegacyNotifications };
