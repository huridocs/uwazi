import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { map } from 'lodash';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/Table.stories';

const { Basic, WithActions, WithCheckboxes, WithInitialState, WithDnD } = composeStories(stories);

describe('Table', () => {
  const data = Basic.args.data || [];

  const checkRowContent = (rowNumber: number, cellsContent: string[]) => {
    cellsContent.forEach((content, index) =>
      cy.get(`tbody > :nth-child(${rowNumber}) > :nth-child(${index + 1})`).contains(content)
    );
  };

  it('should be accessible', () => {
    cy.injectAxe();

    mount(<Basic />);
    cy.checkA11y();

    mount(<WithActions />);
    cy.checkA11y();

    mount(<WithCheckboxes />);
    cy.checkA11y();

    mount(<WithInitialState />);
    cy.checkA11y();
  });

  it('Should return a table with the columns and row specified', () => {
    mount(<Basic />);
    const toStrings = (cells: JQuery<HTMLElement>) => map(cells, 'textContent');
    cy.get('tr th').then(toStrings).should('eql', ['Title', 'Description', 'Date added']);

    checkRowContent(1, ['Entity 2', data[0].description, '2']);
    checkRowContent(2, ['Entity 1', data[1].description, '1']);
    checkRowContent(3, ['Entity 3', data[2].description, '3']);
  });

  it('Should sort the rows with the sorting state specified', () => {
    mount(<WithInitialState />);

    checkRowContent(1, ['Entity 2', data[0].description, '2']);
    checkRowContent(2, ['Entity 3', data[2].description, '3']);
    checkRowContent(3, ['Entity 1', data[1].description, '1']);
  });

  it('should render the data in a custom component', () => {
    mount(<Basic />);
    cy.get('tbody > :nth-child(1) > :nth-child(3) > div').should(
      'have.class',
      'text-center text-white bg-gray-400 rounded'
    );
  });

  it('should render the header appending custom styles passed in the definition of the columns', () => {
    mount(<WithActions />);
    cy.get('table > thead > tr > th:nth-child(3)').should(
      'have.class',
      'px-6 py-3 w-1/3 bg-red-200'
    );
  });

  describe('Sorting', () => {
    it('Should be sortable by title', () => {
      mount(<Basic />);
      cy.get('tr th').contains('Title').click();
      checkRowContent(1, ['Entity 1', data[1].description, '1']);
      checkRowContent(2, ['Entity 2', data[0].description, '2']);
      checkRowContent(3, ['Entity 3', data[2].description, '3']);
    });

    it('should disable sorting when defined in the columns', () => {
      mount(<WithActions />);
      cy.get('tr th').contains('Description').click();
      checkRowContent(1, ['Entity 2', '2', data[0].description]);
    });

    it('should allow external control of sorting', () => {
      const setSortingSpy = cy.stub().as('setSortingSpy');

      mount(<Basic setSorting={setSortingSpy} />);
      cy.get('tr th').contains('Title').click();

      cy.get('@setSortingSpy').should('have.been.calledOnce');
    });
  });

  describe('Selections', () => {
    it('should select items from each table', () => {
      mount(<WithCheckboxes />);
      cy.contains('Short text');
      cy.get('[data-testid="table"]').eq(0).get('thead > tr > th').eq(0).click();

      cy.get('tbody')
        .eq(1)
        .within(() => {
          cy.get('input[type="checkbox"]').eq(0).check();
          cy.get('input[type="checkbox"]').eq(2).check();
        });

      cy.contains('p', 'Selected items for Table A: 3');
      cy.contains('p', 'Selections of Table A: Entity 2, Entity 1, Entity 3,');
      cy.contains('p', 'Selected items for Table B: 2');
      cy.contains('p', 'Selections of Table B: Entity 2, Entity 3,');
    });

    it('should clear selected items when data changes', () => {
      mount(<WithCheckboxes />);
      cy.contains('Short text');

      cy.get('[data-testid="table"]').eq(0).get('thead > tr > th').eq(0).click();

      cy.get('tbody')
        .eq(1)
        .within(() => {
          cy.get('input[type="checkbox"]').eq(0).check();
          cy.get('input[type="checkbox"]').eq(2).check();
        });

      cy.contains('button', 'Update table data').click();

      cy.contains('p', 'Selections of Table A: Entity 2, Entity 1, Entity 3,');
      cy.contains('p', 'Selections of Table B: Entity 2, Entity 3,').should('not.exist');
    });

    it('should not clear selections if data is not changed', () => {
      mount(<WithCheckboxes />);
      cy.contains('Short text');
      cy.get('[data-testid="table"]')
        .eq(1)
        .within(() => cy.get('thead > tr > th').eq(0).click());

      cy.contains('button', 'Reset table data').click();
      cy.contains('p', 'Selections of Table B: Entity 2, Entity 1, Entity 3,');
    });
  });

  describe('DnD', () => {
    it('should sort rows by dragging', () => {
      mount(<WithDnD />);

      cy.get('[data-testid="root-draggable-item-2"]').drag(
        '[data-testid="root-draggable-item-0"]',
        { target: { x: 5, y: 0 } }
      );

      checkRowContent(1, ['Entity 3', data[2].description, '3']);
      checkRowContent(2, ['Entity 2', data[0].description, '2']);
      checkRowContent(3, ['Entity 1', data[1].description, '1']);
    });
  });
});
