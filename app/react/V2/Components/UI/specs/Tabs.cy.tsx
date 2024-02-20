import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/Tabs.stories';

const { Basic } = composeStories(stories);

describe('Tabas', () => {
  beforeEach(() => {
    mount(<Basic />);
  });

  it('should be accessible', () => {
    cy.injectAxe();
    cy.checkA11y();
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

  describe('unmounting', () => {
    it('should not render other tabs by default', () => {
      mount(<Basic />);
      cy.contains('button', 'Tab 2').click();
      cy.contains('h2', 'Tab 3 Content').should('not.exist');
      cy.contains('h2', 'Tab 1 Content').should('not.exist');
    });

    it('should hide tabs if unmounting is disabled', () => {
      Basic.args.unmountTabs = false;
      mount(<Basic />);
      cy.contains('button', 'Tab 2').click();
      cy.contains('h2', 'Tab 3 Content').should('be.hidden');
      cy.contains('h2', 'Tab 1 Content').should('be.hidden');
    });
  });
});
