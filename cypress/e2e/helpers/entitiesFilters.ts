const selectPublishedEntities = () => {
  cy.contains('Published', { timeout: 100 });
  cy.intercept('GET', '/api/search*').as('librarySearch');
  cy.get('aside.library-filters').should('be.visible').as('sidePanel');
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
  cy.get('.library-viewer').scrollTo('top');
};

const selectRestrictedEntities = () => {
  cy.intercept('GET', '/api/search*').as('librarySearch');
  cy.get('aside.library-filters').should('be.visible', { setTimeout: 100 }).as('sidePanel');
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
};

export { selectPublishedEntities, selectRestrictedEntities };
