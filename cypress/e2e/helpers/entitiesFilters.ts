const selectPublishedEntities = () => {
  cy.contains('Published', { timeout: 5000 });
  cy.intercept('GET', '/api/search*').as('librarySearch');
  cy.get('aside.library-filters').should('be.visible', { timeout: 5000 }).as('sidePanel');

  // Always ensure we're in the correct state and wait for API completion
  cy.get('#publishedStatuspublished')
    .invoke('is', ':checked')
    .then(checked => {
      if (!checked) {
        cy.get('@sidePanel').contains('span', 'Published').click();
        cy.wait('@librarySearch');
      }
    });
  cy.get('#publishedStatusrestricted')
    .invoke('is', ':checked')
    .then(checked => {
      if (checked) {
        cy.get('@sidePanel').contains('span', 'Restricted').click();
        cy.wait('@librarySearch');
      }
    });

  // Always wait for the search results to be rendered, regardless of filter changes
  cy.get('.item-document', { timeout: 10000 }).should('be.visible');

  // Additional verification: ensure we're showing published entities
  cy.get('.item-document').should('have.length.at.least', 25); // Published entities should be many
  cy.get('.library-viewer').scrollTo('top');
};

const selectRestrictedEntities = () => {
  cy.contains('Published', { timeout: 5000 });
  cy.intercept('GET', '/api/search*').as('librarySearch');
  cy.get('aside.library-filters').should('be.visible', { timeout: 5000 }).as('sidePanel');

  // Always ensure we're in the correct state and wait for API completion
  cy.get('#publishedStatuspublished')
    .invoke('is', ':checked')
    .then(checked => {
      if (checked) {
        cy.get('@sidePanel').contains('span', 'Published').click();
        cy.wait('@librarySearch');
      }
    });
  cy.get('#publishedStatusrestricted')
    .invoke('is', ':checked')
    .then(checked => {
      if (!checked) {
        cy.get('@sidePanel').contains('span', 'Restricted').click();
        cy.wait('@librarySearch');
      }
    });

  // Wait for the search results to be rendered and ensure we have the expected count
  cy.get('.item', { timeout: 10000 }).should('be.visible');

  // Additional verification: ensure the filter is actually applied by checking the results
  // Verify that we're showing restricted entities (should be fewer than published)
  cy.get('.item').should('have.length.at.least', 1);
  cy.get('.item').should('have.length.at.most', 10); // Restricted entities should be much fewer than 30
};

export { selectPublishedEntities, selectRestrictedEntities };
