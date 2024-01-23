const selectPublishedEntities = () => {
  cy.contains('Published', { timeout: 100 });
  cy.get('aside.library-filters').should('be.visible').as('sidePanel');
  cy.get('#publishedStatuspublished')
    .invoke('is', ':checked')
    .then(checked => {
      if (!checked) {
        cy.get('@sidePanel').contains('span', 'Published').click();
      }
    });
  cy.get('#publishedStatusrestricted')
    .invoke('is', ':checked')
    .then(checked => {
      if (checked) {
        cy.get('@sidePanel').contains('span', 'Restricted').click();
      }
    });
};

const selectRestrictedEntities = () => {
  cy.get('aside.library-filters').should('be.visible', { setTimeout: 100 }).as('sidePanel');
  cy.get('#publishedStatuspublished')
    .invoke('is', ':checked')
    .then(checked => {
      if (checked) {
        cy.get('@sidePanel').contains('span', 'Published').click();
      }
    });
  cy.get('#publishedStatusrestricted')
    .invoke('is', ':checked')
    .then(checked => {
      if (!checked) {
        cy.get('@sidePanel').contains('span', 'Restricted').click();
      }
    });
};

export { selectPublishedEntities, selectRestrictedEntities };
