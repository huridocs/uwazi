const selectPublishedEntities = () => {
  cy.get('#publishedStatuspublished')
    .invoke('is', ':checked')
    .then(checked => {
      if (!checked) {
        cy.get('aside').contains('span', 'Published').click();
      }
    });
  cy.get('#publishedStatusrestricted')
    .invoke('is', ':checked')
    .then(checked => {
      if (checked) {
        cy.get('aside').contains('span', 'Restricted').click();
      }
    });
};

const selectRestrictedEntities = () => {
  cy.get('#publishedStatuspublished')
    .invoke('is', ':checked')
    .then(checked => {
      if (checked) {
        cy.get('aside').contains('span', 'Published').click();
      }
    });
  cy.get('#publishedStatusrestricted')
    .invoke('is', ':checked')
    .then(checked => {
      if (!checked) {
        cy.get('aside').contains('span', 'Restricted').click();
      }
    });
};

export { selectPublishedEntities, selectRestrictedEntities };
