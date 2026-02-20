const clickOnCreateEntity = () => {
  cy.intercept('GET', 'api/dictionaries').as('fetchThesauri');
  cy.contains('button', 'Create entity').click();
  cy.wait('@fetchThesauri');
};

const clickOnEditEntity = (buttonTitle: string = 'Edit') => {
  let didFetchDictionaries = false;
  cy.intercept('GET', 'api/dictionaries', req => {
    didFetchDictionaries = true;
    req.continue();
  }).as('fetchThesauri');
  cy.get('body').then($body => {
    const sidePanelEditButton = $body.find(
      `aside.metadata-sidepanel.is-active button.edit-metadata:contains("${buttonTitle}")`
    );
    if (sidePanelEditButton.length) {
      cy.get('aside.metadata-sidepanel.is-active')
        .contains('button.edit-metadata', buttonTitle)
        .scrollIntoView()
        .click({ force: true });
      return;
    }
    cy.contains('button', buttonTitle).scrollIntoView().click({ force: true });
  });
  cy.then(() => {
    if (didFetchDictionaries) {
      cy.wait('@fetchThesauri');
    }
  });
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

const saveEntity = (message = 'Entity created') => {
  cy.intercept('POST', '/api/entities').as('saveEntity');
  cy.contains('button', 'Save').click();
  cy.wait('@saveEntity');
  cy.contains(message);
};

export { clickOnCreateEntity, clickOnEditEntity, shareSearchTerm, grantPermission, saveEntity };
