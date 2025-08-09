const editPropertyForExtractor = (templateName: string, property: string, shouldUnfold = true) => {
  cy.contains('li', templateName).scrollIntoView();

  cy.contains('li', templateName).within(() => {
    if (shouldUnfold) {
      cy.contains('button', 'Group').click();
    }
    cy.contains('span', property).should('be.visible');
    cy.contains('span', property).click();
  });
};

export { editPropertyForExtractor };
