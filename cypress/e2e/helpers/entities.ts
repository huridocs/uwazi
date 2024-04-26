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

const shareSearchTerm = (term: string, expectedTerm?: string) => {
  cy.intercept('GET', `/api/collaborators?filterTerm=${term}`).as(`inlinesearch${term}`);
  cy.clearAndType('[data-testid=modal] input', term);
  cy.get('[data-testid=modal] input').click();
  cy.wait(`@inlinesearch${term}`);
  cy.contains('.userGroupsLookupField span', expectedTerm || term).click({ force: true });
};

const grantPermission = (row: number, previous: string, action: string = 'write') => {
  cy.contains(`tr:nth-child(${row})`, previous).within(() => {
    cy.get('select').select(action, { force: true });
  });
  cy.intercept('POST', '/api/entities/permissions').as('savePermissions');
  cy.get('[data-testid=modal]').contains('button', 'Save changes').click();
  cy.wait('@savePermissions');
  cy.contains('Update success');
};

export { clickOnCreateEntity, clickOnEditEntity, shareSearchTerm, grantPermission };
