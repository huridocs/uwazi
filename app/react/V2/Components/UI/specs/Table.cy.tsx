import React from 'react';
import { mount } from '@cypress/react18';
import { map } from 'lodash';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/Table.stories';

const { Basic, WithActions } = composeStories(stories);

const data = Basic.args?.data || [];

describe('Table', () => {
  const checkRowContent = (rowNumber: number, cellsContent: string[]) => {
    cellsContent.forEach((content, index) =>
      cy.get(`tbody > :nth-child(${rowNumber}) > :nth-child(${index + 1})`).contains(content)
    );
  };

  it('Should return a table with the columns and row specified', () => {
    mount(<Basic />);
    const toStrings = (cells: JQuery<HTMLElement>) => map(cells, 'textContent');
    cy.get('tr th').then(toStrings).should('eql', ['Title', 'Description', 'Date added']);

    checkRowContent(1, ['Entity 2', data[0].description, '2']);
    checkRowContent(2, ['Entity 1', data[1].description, '1']);
    checkRowContent(3, ['Entity 3', data[2].description, '3']);
  });

  it('should render the data in a custom component', () => {
    mount(<Basic />);
    cy.get('tbody > :nth-child(1) > :nth-child(3) > div').should(
      'have.class',
      'bg-gray-400 rounded text-white text-center'
    );
  });

  it('should render the header appending custom styles passed in the definition of the columns', () => {
    mount(<WithActions />);
    cy.get('table > thead > tr > th:nth-child(3)').should(
      'have.class',
      'px-6 py-3 w-1/3 bg-red-500 text-white'
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
  });
});
