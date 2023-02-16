import React from 'react';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/testing-react';

import _ from 'lodash';
import * as stories from '../LocalTable.stories';

const { Basic } = composeStories(stories);

describe('LocalTable.cy.tsx', () => {
  it('Should empty the field when clicking the cross', () => {
    mount(<Basic />);
    const toStrings = (cells: JQuery<HTMLElement>) => _.map(cells, 'textContent');

    cy.get('tr th').then(toStrings).should('eql', ['', 'Icon', 'Title', 'Date added']);
  });
});
