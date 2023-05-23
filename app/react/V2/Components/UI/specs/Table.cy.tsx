import React from 'react';
import { mount } from '@cypress/react18';
import { map } from 'lodash';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/Table.stories';

const { Basic } = composeStories(stories);

const data = Basic.args?.data || [];

describe('Table', () => {
  beforeEach(() => {
    mount(<Basic />);
  });

  const checkRowContent = (rowNumber: number, cellsContent: string[]) => {
    cellsContent.forEach((content, index) =>
      cy
        .get(`tbody.text-gray-900 > :nth-child(${rowNumber}) > :nth-child(${index + 2})`)
        .contains(content)
    );
  };

  it('Should return a table with the columns and row specified', () => {
    const toStrings = (cells: JQuery<HTMLElement>) => map(cells, 'textContent');
    cy.get('tr th').then(toStrings).should('eql', ['', 'Title', 'Description', 'Date added']);
    cy.get('tbody>tr td').get('[type="checkbox"]');

    checkRowContent(1, ['Entity 2', data[0].description, '2']);
    checkRowContent(2, ['Entity 1', data[1].description, '1']);
    checkRowContent(3, ['Entity 3', data[2].description, '3']);
  });

  it('Should be sortable by title', () => {
    cy.get('tr th').contains('Title').click();
    checkRowContent(1, ['Entity 1', data[1].description, '1']);
    checkRowContent(2, ['Entity 2', data[0].description, '2']);
    checkRowContent(3, ['Entity 3', data[2].description, '3']);
  });
});
