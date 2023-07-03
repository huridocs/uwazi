import { clearCookiesAndLogin } from './helpers';

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

describe('Information Extraction', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-puppeteer-fixtures', { env });
    cy.exec('yarn ix-config', { env });
    clearCookiesAndLogin();
    labelEntityTitle(0, 'Lorem Ipsum');
    cy.get('a[aria-label="Library"]').click();
    labelEntityTitle(1, 'Uwazi Heroes Investigation');
  });

  it('should navigate to metadata extraction', () => {
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.contains('span', 'Metadata Extraction').click();
  });

  it('Should create an extractor', () => {
    cy.contains('span', 'Create Extractor').click();
    cy.get('[data-testid=modal]').get('input').type('Extractor 1');
    cy.get('[data-testid=modal]').contains('li', 'Ordenes del presidente').as('firstTemplate');
    cy.get('@firstTemplate').find('label').click();
    cy.get('@firstTemplate').contains('label', 'Title').click();
    cy.get('[data-testid=modal]').contains('li', 'Causa').as('secondTemplate');
    cy.get('@secondTemplate').find('label').click();
    cy.get('@secondTemplate').contains('label', 'Title').click();
    cy.contains('button', 'Add').click();
    cy.contains('.table', 'Extractor 1').should('have.length', 1);
  });

  it('should select all templates when from all templates button is clicked', () => {
    cy.get('.extractor-checkbox > input').click();
    cy.contains('button', 'Edit Extractor').click();
    cy.contains('button', 'From all templates').click();
    cy.get('.ix-extraction-multiselect input').should('be.checked');
    cy.contains('button', 'Cancel').click();
  });

  it('should edit an extractor', () => {
    cy.contains('button', 'Edit Extractor').click();
    cy.get('input.extractor-name-input').type(' edited');
    cy.contains('.multiselectChild label', 'Title').click();
    cy.contains('li', 'Ordenes de la corte').as('template');
    cy.get('@template').find('label').click();
    cy.get('@template').contains('label', 'Title').click();
    cy.contains('button', 'Save').click();
    cy.contains('.table thead tr th span', 'Property').should('be.visible');
    cy.contains('.table', 'Extractor 1 edited').should('have.length', 1);
  });

  it('should show title initial suggestion states as Empty / Label', () => {
    cy.get('a.btn-success.btn-xs').click();
    cy.get('.suggestion-templates span').eq(1).should('be.visible');
    cy.get('.training-dashboard').should('be.visible');
    cy.get('table').should('be.visible');
    cy.get('.settings-content').toMatchImageSnapshot({ name: 'ix-1' });
  });

  it('should find suggestions successfully', { defaultCommandTimeout: 6000 }, () => {
    cy.get('.suggestion-templates span').eq(1).should('be.visible');
    cy.get('.training-dashboard').should('be.visible');
    cy.get('table').should('be.visible');
    cy.contains('button', 'Find suggestions').click();
    cy.get('table tr').should('have.length.above', 1);
    cy.get('.settings-content').toMatchImageSnapshot({ name: 'ix-2' });
  });

  it('should show filters sidepanel', () => {
    cy.get('.suggestion-templates span').eq(1).should('be.visible');
    cy.get('.training-dashboard').should('be.visible');
    cy.get('table').should('be.visible');
    cy.contains('button', 'Show Filters').click();
    cy.get('.settings-content .sidepanel-body').toMatchImageSnapshot({ name: 'ix-3' });
  });

  it('should delete an extractor', () => {
    cy.contains('span', 'Metadata Extraction').click();
    cy.get('.extractor-checkbox input').click();
    cy.contains('button', 'Delete').click();
    cy.contains('button', 'Create Extractor').should('be.visible');
    cy.get('table').toMatchImageSnapshot({ name: 'ix-4' });
  });
});
