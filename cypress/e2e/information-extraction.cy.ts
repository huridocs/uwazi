import { login } from './helpers';

const labelEntityTitle = (
  entityPos: number,
  selectValue: string,
  selector: string = 'span[role="presentation"]'
) => {
  cy.get('.view-doc').eq(entityPos).click();
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
    const firstTemplate = cy.contains('li', 'Ordenes del presidente');
    firstTemplate.find('label').click();
    cy.get('.multiselectChild.is-active label.multiselectItem-option').eq(1).click();
    const secondTemplate = cy.contains('li', 'Causa');
    secondTemplate.find('label').click();
    cy.get('.multiselectChild.is-active label.multiselectItem-option').eq(1).click();
    cy.contains('button', 'Add').click();
    cy.get('.table tbody tr').should('have.length', 1); // Forced to wait for the table to populate
    cy.get('.table').compareSnapshot('create-extractor');
  });

  it('should select all templates when from all templates button is clicked', () => {
    englishLoggedInUwazi();
    navigateToMetadataExtractionPage();
    cy.get('.extractor-checkbox > input').click();
    cy.contains('button', 'Edit Extractor').click();
    cy.contains('button', 'From all templates').click();
    cy.get('.extractor-creation-modal').compareSnapshot('new-extractor-popup', 0.08);
  });

  it('should edit an extractor', () => {
    englishLoggedInUwazi();
    navigateToMetadataExtractionPage();
    cy.get('.extractor-checkbox > input').click();
    cy.contains('button', 'Edit Extractor').click();
    cy.get('input.extractor-name-input').type(' edited');
    cy.get('.multiselectChild.is-active label.multiselectItem-option').eq(1).click();
    const template = cy.contains('li', 'Ordenes de la corte');
    template.find('label').click();
    cy.get('.multiselectChild.is-active label.multiselectItem-option').eq(1).click();
    cy.contains('button', 'Save').click();
    cy.contains('.table thead tr th span', 'Property').should('be.visible');
    cy.get('.table').compareSnapshot('edit-extractor');
  });

  it('should show title initial suggestion states as Empty / Label', () => {
    englishLoggedInUwazi();
    navigateToMetadataExtractionPage();
    cy.get('a.btn-success.btn-xs').click();
    cy.get('.suggestion-templates span').eq(1).should('be.visible');
    cy.get('.training-dashboard').should('be.visible');
    cy.get('table').should('be.visible');
    cy.get('.settings-content').compareSnapshot('suggestion-states', 0.05);
  });
});
