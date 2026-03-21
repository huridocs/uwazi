const waitForPDF = () => {
  cy.intercept('GET', '/api/files/*.pdf').as('fileGET');
  cy.wait('@fileGET');
  cy.get('#pdf-container .canvasWrapper').should('be.visible');
};

export { waitForPDF };
