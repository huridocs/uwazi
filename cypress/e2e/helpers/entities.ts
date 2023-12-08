const clickOnCreateEntity = () => {
  cy.intercept('GET', 'api/thesauris').as('fetchThesauri');
  cy.contains('button', 'Create entity').click();
  cy.wait('@fetchThesauri');
};

const clickOnEditEntity = (buttonTitle: string = 'Edit') => {
  cy.intercept('GET', 'api/thesauris').as('fetchThesauri');
  cy.contains('button', buttonTitle).click();
  cy.wait('@fetchThesauri');
};

export { clickOnCreateEntity, clickOnEditEntity };
