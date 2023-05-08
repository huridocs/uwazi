import React from 'react';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/testing-react';
import * as stories from 'app/stories/Tabs.stories';

const { Basic } = composeStories(stories);

describe('Tabas', () => {
  beforeEach(() => {
    mount(<Basic />);
  });

  it('should render the first tab by defaut', () => {
    cy.contains('h2', 'Tab 1 Content');
  });

  it('should allow switching tabs', () => {
    cy.contains('button', 'Tab 2').click();
    cy.contains('h2', 'Tab 2 Content');

    cy.contains('button', 'Tab 3').click();
    cy.contains('h2', 'Tab 3 Content');
  });

  it('should no render other tabs', () => {
    cy.contains('button', 'Tab 2').click();
    cy.contains('h2', 'Tab 3 Content').should('not.exist');
    cy.contains('h2', 'Tab 1 Content').should('not.exist');
  });
});
