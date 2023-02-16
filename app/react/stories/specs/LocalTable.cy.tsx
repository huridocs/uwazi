import React from 'react';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/testing-react';
import _ from 'lodash';
import * as stories from '../LocalTable.stories';

const { Basic } = composeStories(stories);

describe('LocalTable.cy.tsx', () => {
  it('Should return a table with the columns and row specified', () => {
    mount(<Basic />);
    const toStrings = (cells: JQuery<HTMLElement>) => _.map(cells, 'textContent');
    cy.get('tr th').then(toStrings).should('eql', ['', 'Icon', 'Title', 'Date added']);
    const firstRow = cy.get('tbody>tr').get('td');
    firstRow.eq(0).get('[type="checkbox"]');
  });
});
