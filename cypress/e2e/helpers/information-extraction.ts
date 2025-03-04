const editPropertyForExtractor = (
  alias: string,
  templateName: string,
  property: string,
  shouldUnfold = true
) => {
  cy.contains('span', templateName).as(alias);
  if (shouldUnfold) cy.get(`@${alias}`).click();
  cy.get(`@${alias}`).parent().parent().contains('span', property).click();
};

export { editPropertyForExtractor };
