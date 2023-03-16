import { login } from './helpers';

const labelEntityTitle = (
  entityPos: number,
  selectValue: string,
  selector: string = 'span[role="presentation"]'
) => {
  cy.get('.view-doc').eq(entityPos).click();
  // cy.wait(2000);
  //@ts-ignore
  cy.contains(selector, selectValue).setSelection(selectValue);
  cy.get('button.edit-metadata').click();
  cy.get('button.extraction-button').first().click();
  cy.get('textarea[name="documentViewer.sidepanel.metadata.title"]')
    .invoke('val')
    .should('eq', selectValue);
  cy.get('button[type="submit"]').click();
  cy.get('div.alert-success').click();
};

const changeLanguage = () => {
  cy.get('.menuNav-language > .dropdown').click();
  cy.get('div[aria-label="Languages"]  li.menuNav-item:nth-child(2) a').click();
};

const englishLoggedInUwazi = () => {
  cy.visit('http://localhost:3000');
  changeLanguage();
  login('admin', 'admin');
};

const navigateToMetadataExtractionPage = () => {
  cy.get('.only-desktop a[aria-label="Settings"]').click();
  cy.contains('span', 'Metadata Extraction').click();
};

describe('Information Extraction', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-puppeteer-fixtures', { env });
    cy.exec('yarn ix-config', { env });

    cy.visit('http://localhost:3000');
    changeLanguage();
    login('admin', 'admin');
    labelEntityTitle(0, 'Lorem Ipsum');
    cy.get('a[aria-label="Library"]').click();
    labelEntityTitle(1, 'Uwazi Heroes Investigation');
  });

  it('Should create an extractor', () => {
    navigateToMetadataExtractionPage();
    cy.contains('span', 'Create Extractor').click();
    cy.get('input.extractor-name-input').type('Extractor 1');
    cy.contains('span.multiselectItem-name', 'Ordenes del presidente').click();
    cy.get('.multiselectChild.is-active label.multiselectItem-option').eq(1).click();
    cy.contains('span.multiselectItem-name', 'Causa').click();
    cy.get('.multiselectChild.is-active label.multiselectItem-option').eq(1).click();
    cy.contains('.modal-footer .extractor-footer span', 'Add').click();
    cy.get('.table tbody tr').should('have.length', 1); // Forced to wait for the table to populate
    cy.get('.table').compareScreenshot();
  });

  it('should select all templates when from all templates button is clicked', () => {
    englishLoggedInUwazi();
    navigateToMetadataExtractionPage();
    cy.get('.extractor-checkbox > input').click();
    cy.contains('span', 'Edit Extractor').click();
    cy.contains('span', 'From all templates').click();
    cy.get('.extractor-creation-modal').compareScreenshot();
  });

  it('should edit an extractor', () => {
    englishLoggedInUwazi();
    navigateToMetadataExtractionPage();
    cy.get('.extractor-checkbox > input').click();
    cy.contains('span', 'Edit Extractor').click();
    cy.get('input.extractor-name-input').type(' edited');
    cy.get('.multiselectChild.is-active label.multiselectItem-option').eq(1).click();
    cy.contains('span.multiselectItem-name', 'Ordenes de la corte').click();
    cy.get('.multiselectChild.is-active label.multiselectItem-option').eq(1).click();
    cy.contains('.modal-footer .extractor-footer span', 'Save').click();
    cy.get('.table tbody tr td').should('contain.text', 'Extractor 1 edited');
    cy.wait(200);
    cy.get('.table').compareScreenshot();
  });

  it('should show title initial suggestion states as Empty / Label', () => {
    englishLoggedInUwazi();
    navigateToMetadataExtractionPage();
    cy.get('a.btn-success.btn-xs').click();
    cy.get('.suggestion-templates span').eq(0).should('contain.text', 'Ordenes del presidente');
    cy.get('.suggestion-templates span').eq(1).should('contain.text', 'Ordenes de la corte');
    cy.get('.settings-content').compareScreenshot();
  });
});
