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
    cy.get('tbody>tr td').get('[type="checkbox"]');
    cy.get('tbody>tr:first-child td:nth-child(3)').debug();
    cy.get('tbody>tr:first-child td:nth-child(3)').contains('Entity 1');
    cy.get('tbody>tr:first-child td:nth-child(4)').contains('1676306456');
  });
});
