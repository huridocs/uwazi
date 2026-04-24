const saveTemplate = () => {
  cy.intercept('POST', 'api/templates').as('postTemplate');
  cy.contains('button', 'Save').click();
  cy.wait('@postTemplate').its('response.statusCode').should('eq', 200);
  cy.get('[data-testid="notification-flash"]').should('be.visible');
};

const setColor = (color: string) => {
  cy.contains('button', 'Template color').click();
  cy.contains('label', 'Manually set a color');
  cy.get('input[name="template-color"]').clear();
  cy.get('input[name="template-color"]').type(color);
  cy.contains('button', 'Template color').click();
};

const createProperties = (properties: string[]) => {
  cy.wrap(properties).each((property: string) => {
    cy.contains('button', 'Add property').click();

    cy.get('select[id="property-type"]').select(property);

    if (property === 'Select' || property === 'Multiple select') {
      cy.get('select[name="content"]').select(3);
    }

    if (property === 'Relationship') {
      cy.get('select[name="relationType"]').select(2);
      cy.get('select[name="content"]').select(5);
    } else if (property === 'Media') {
      cy.get('input[name="showInCard"]').check();
    }

    cy.contains('aside button', 'Add property').click();
  });
};

const createTemplate = (title: string, properties?: string[], color?: string) => {
  cy.get('a').contains('Templates').click();
  cy.get('a').contains('Add template').click();

  cy.get('input[id="template-name"]').type(title, { delay: 0 });

  if (properties?.length) {
    createProperties(properties);
  }

  if (color) {
    setColor(color);
  }

  saveTemplate();
};

export { createTemplate };
