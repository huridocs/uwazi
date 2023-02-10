/// <reference types="cypress" />
import { login } from './helpers';

function labelEntityTitle(
  entityPos: number,
  selectValue: string,
  selector: string = 'span[role="presentation"]'
) {
  cy.get('.view-doc').eq(entityPos).click();
  const pdfElementToSelect = cy.contains(selector, selectValue);
  pdfElementToSelect.setSelection(selectValue);
  cy.get('button.edit-metadata').click();
  cy.get('button.extraction-button').first().click();
  cy.get('textarea[name="documentViewer.sidepanel.metadata.title"]')
    .invoke('val')
    .should('eq', selectValue);
  cy.get('button[type="submit"]').click();
  cy.get('div.alert-success').click();
}

const changeLanguage = () => {
  cy.get('.menuNav-language > .dropdown').click();
  cy.get('div[aria-label="Languages"]  li.menuNav-item:nth-child(2) a').click();
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
  it('Should configure properties', () => {
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.contains('span', 'Metadata Extraction').click();
    cy.contains('span', 'Configure properties').click();
    cy.contains('span.multiselectItem-name', 'Ordenes del presidente').click();
    cy.contains('span.multiselectItem-name', 'Ordenes de la corte').click();
    cy.get('button.btn-success').click();
    cy.get('.table tbody tr').should('have.length', 2);
  });
});
