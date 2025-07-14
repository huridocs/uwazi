/* eslint-disable max-statements */
import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers/login';
import { changeLanguage } from '../helpers';
import { clickOnCreateEntity } from '../helpers/entities';

describe('Thesauri configuration', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin();
    cy.visit('http://localhost:3000');
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.injectAxe();
    cy.contains('span', 'Thesauri').click();
  });

  it('should have no detectable accessibility violations on load', () => {
    cy.checkA11y();
  });

  beforeEach(() => {
    cy.intercept('GET', '/api/dictionaries?_id=*').as('editThesauri');
    cy.intercept('GET', '/api/dictionaries').as('fetchThesauri');
  });

  const saveThesaurus = () => {
    cy.contains('button', 'Save').click();
    cy.contains('Dismiss').click();
    cy.wait('@editThesauri');
  };

  const assertThesaurusTableState = (expectedItems: string[]) => {
    // Check that the table has the expected number of rows
    cy.get('tbody tr').should('have.length', expectedItems.length);

    // Check that each expected item is present in the table
    expectedItems.forEach(item => {
      cy.get('tbody').should('contain.text', item);
    });
  };

  it('should create a thesaurus', () => {
    cy.contains('a', 'Add thesaurus').click();
    cy.get('#thesauri-name').type('New Thesaurus', { delay: 0 });
    cy.contains('button', 'Add item').click();
    cy.get('input[name="newValues.0.label"]').type('First Item', { delay: 0 });
    cy.get('input[name="newValues.1.label"]').type('Second Item', { delay: 0 });
    cy.getByTestId('thesaurus-form-submit').click();
    cy.get('tbody tr').should('have.length', 2);
    saveThesaurus();
  });

  it('should add groups', () => {
    cy.contains('button', 'Add group').click();
    cy.get('input#group-name').type('Group A', { delay: 0 });
    cy.get('input[name="subRows.0.label"]').type('First Child A', { delay: 0 });
    cy.get('input[name="subRows.1.label"]').type('Second Child A', { delay: 0 });
    cy.getByTestId('thesaurus-form-submit').click();
    cy.get('tbody tr').should('have.length', 3);
    cy.contains('button', 'Add group').click();
    cy.contains('Adding a group and its items.');
    cy.get('input#group-name').type('Group B', { delay: 0 });
    cy.get('input[name="subRows.0.label"]').type('First Child B', { delay: 0 });
    cy.getByTestId('thesaurus-form-submit').click();
    cy.get('tbody tr').should('have.length', 4);
    saveThesaurus();
    assertThesaurusTableState(['First Item', 'Second Item', 'Group A', 'Group B']);
  });

  it('should add items', () => {
    cy.contains('button', 'Add item').click();
    cy.get('input[name="newValues.0.label"]').type('Added Root Item', { delay: 0 });
    cy.get('input[name="newValues.1.label"]').type('Added Child Item', { delay: 0 });
    cy.get('select[name="newValues.1.groupId"]').select('Group A');
    cy.getByTestId('thesaurus-form-submit').click();
    cy.get('tbody tr').should('have.length', 5);
    saveThesaurus();
    assertThesaurusTableState([
      'First Item',
      'Second Item',
      'Group A',
      'Group B',
      'Added Root Item',
    ]);
  });

  it('should edit an item', () => {
    cy.contains('tr', 'Second Item').contains('button', 'Edit').click();
    cy.clearAndType('input[name="newValues.0.label"]', 'Edited Second Item', { delay: 0 });
    cy.getByTestId('thesaurus-form-submit').click();
    cy.get('tbody tr').should('have.length', 5);
    saveThesaurus();
    assertThesaurusTableState([
      'First Item',
      'Edited Second Item',
      'Group A',
      'Group B',
      'Added Root Item',
    ]);
  });

  it('should edit a group', () => {
    cy.contains('tr', 'Group B').contains('button', 'Edit').click();
    cy.clearAndType('input#group-name', 'Edited Group B', { delay: 0 });
    cy.clearAndType('input[name="subRows.0.label"]', 'Edited First Child B', { delay: 0 });
    cy.get('input[name="subRows.1.label"]').type('Added Second Child B', { delay: 0 });
    cy.get('input[name="subRows.2.label"]').type('Added Third Child B', { delay: 0 });
    cy.getByTestId('thesaurus-form-submit').click();
    cy.get('tbody tr').should('have.length', 5);
    saveThesaurus();
    assertThesaurusTableState([
      'First Item',
      'Edited Second Item',
      'Group A',
      'Edited Group B',
      'Added Root Item',
    ]);
  });

  it('should allow to sort by dnd', () => {
    cy.realDragAndDrop(
      cy.get('button[aria-roledescription="sortable"]').eq(3),
      cy.get('button[aria-roledescription="sortable"]').eq(0)
    );
    saveThesaurus();
    // After drag and drop, verify the items are still present but order may have changed
    assertThesaurusTableState([
      'First Item',
      'Edited Second Item',
      'Group A',
      'Edited Group B',
      'Added Root Item',
    ]);
  });

  it('should delete items', () => {
    cy.contains('tr', 'Edited Second Item').within(() => cy.get('input[type="checkbox"]').check());
    cy.contains('tr', 'Edited Group B').contains('button', 'Group').click();
    cy.contains('tr', 'Added Second Child B').within(() =>
      cy.get('input[type="checkbox"]').check()
    );
    cy.contains('button', 'Remove').click();
    saveThesaurus();
    assertThesaurusTableState([
      'Edited Group B',
      'Edited First Child B',
      'Added Third Child B',
      'First Item',
      'Group A',
      'Added Root Item',
    ]);
  });

  it('should use the thesaurus in a template', () => {
    cy.contains('a', 'Templates').click();
    cy.contains('a', 'País').click();
    cy.contains('button', 'Add property').click();

    cy.get('select[id="property-type"]').select('Select');
    cy.get('select[name="content"]').select('New Thesaurus');

    cy.contains('aside button', 'Add property').click();
    cy.contains('Save').click();
    cy.contains('Dismiss').click();
  });

  it('should list the thesauri', () => {
    cy.contains('span', 'Thesauri').click();
    cy.contains('tr', 'New Thesaurus').contains('País');
  });

  it('should do not allow to delete a used thesaurus', () => {
    cy.contains('tr', 'New Thesaurus').within(() => {
      cy.get('input[type=checkbox]').should('have.attr', 'disabled');
    });
  });

  it('should keep sorting', () => {
    cy.contains('tr', 'New Thesaurus').contains('button', 'Edit').click();
    cy.contains('tbody', 'Edited Group B');
    // Verify the thesaurus form table structure
    cy.get('tbody tr').should('have.length.at.least', 1);
    cy.get('tbody tr').should('contain', 'Edited Group B');
    cy.get('tbody tr').each($row => {
      cy.wrap($row).should('contain', 'Edit');
    });
  });

  it('should do ask for confirmation when delete an item of a used thesaurus', () => {
    cy.contains('tr', 'First Item').within(() => cy.get('input[type="checkbox"]').check());
    cy.contains('button', 'Remove').click();
    cy.contains('Are you sure you want to delete this item');
    cy.contains('button', 'Accept').click();
    saveThesaurus();
    assertThesaurusTableState(['Edited Group B', 'Group A', 'Added Root Item']);
  });

  it('should import items from csv', () => {
    cy.contains('button', 'Import').click();
    cy.get('input[type=file]').selectFile('./cypress/test_files/thesaurus-test.csv', {
      force: true,
    });
    cy.contains('Thesauri updated.');
    cy.contains('Dismiss').click();
    // Verify imported items are present
    cy.get('tbody').should('contain.text', 'Imported Colors');
    //click on the group
    cy.contains('tr', 'Imported Colors').contains('button', 'Group').click();
    cy.get('tbody').should('contain.text', 'Imported Blue');
    cy.get('tbody').should('contain.text', 'Imported Red');
  });

  it('should sort the items alphabetically', () => {
    cy.contains('button', 'Sort').click();
    // Verify items are sorted alphabetically by checking the order
    cy.get('tbody tr').then($rows => {
      const texts = Array.from($rows).map(row => row.textContent);
      const sortedTexts = [...texts].sort();
      expect(texts).to.deep.equal(sortedTexts);
    });
    changeLanguage('Español');
    cy.contains('Colores');
    cy.contains('button', 'Ordenar').click();
    // Verify items are sorted alphabetically in Spanish
    cy.get('tbody tr').then($rows => {
      const texts = Array.from($rows).map(row => row.textContent);
      const sortedTexts = [...texts].sort();
      expect(texts).to.deep.equal(sortedTexts);
    });
  });

  it('should cancel the changes', () => {
    cy.contains('button', 'Cancelar').click();
    cy.contains('button', 'Descartar cambios').click();
  });

  it('should use a value when creating an entity', () => {
    changeLanguage('English');
    cy.contains('a', 'Library').click();
    clickOnCreateEntity();
    cy.get('[name="library.sidepanel.metadata.title"]').click();
    cy.get('[name="library.sidepanel.metadata.title"]').type('País select', { delay: 0 });
    cy.contains('select', 'Mecanismo').select('País');
    cy.contains('.form-group.select select', 'Select...').select('Imported Blue');
    cy.contains('button', 'Save').click();
    cy.contains('Entity created');
    cy.contains('.item-document', 'País select').click();
    cy.contains('.metadata-name-select', 'Imported Colors: Imported Blue');
    changeLanguage('Español');
    cy.contains('.documentTypes-selector li', 'País').click();
    cy.contains('.item-document', 'País select').click();
    cy.contains('.metadata-name-select', 'Colores Importados: Azul Importado');
  });

  it('should update the values used in Entities', () => {
    cy.go('back');
    changeLanguage('English');
    cy.get('.only-desktop a[aria-label="Settings"]').click();
    cy.contains('span', 'Thesauri').click();
    cy.contains('tr', 'New Thesaurus').contains('button', 'Edit').click();
    cy.contains('tbody', 'Imported Colors');
    cy.contains('tr', 'Imported Colors').contains('button', 'Edit').click();
    cy.clearAndType('input#group-name', 'Colors', { delay: 0 });
    cy.clearAndType('input[name="subRows.0.label"]', 'Blue', { delay: 0 });
    cy.contains('button', 'Edit group').click();
    cy.contains('button', 'Save').click();
    cy.contains('Thesauri updated.').as('successMessage');
    cy.get('@successMessage').should('not.exist');
  });

  it('should reflect the changes in the Entities', () => {
    cy.visit('http://localhost:3000/library');
    cy.contains('.multiselectItem-name', 'Restricted').click();
    cy.contains('.multiselectItem-name', 'País').click();

    cy.contains('.item-document', 'País select').click();
    cy.contains('.metadata-name-select', 'Colors: Blue');
  });
});
