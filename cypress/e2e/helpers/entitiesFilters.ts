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
  cy.get('.library-viewer').scrollTo('top');
};

const selectRestrictedEntities = () => {
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

  // Always wait for the search results to be rendered, regardless of filter changes
  cy.get('.item', { timeout: 10000 }).should('be.visible');
};

export { selectPublishedEntities, selectRestrictedEntities };
