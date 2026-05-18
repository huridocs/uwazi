import React from 'react';
import 'cypress-axe';
import { mount } from 'cypress/react';
import { composeStories } from '@storybook/react';
import * as stories from '#app/stories/Tabs.stories.js';
import { Tabs } from '#V2/Components/UI/Tabs.js';

const { Basic } = composeStories(stories);

describe('Tabs', () => {
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

  it('should update a controlled tab when initialTabId changes', () => {
    const ControlledTabs = () => {
      const [active, setActive] = React.useState('tab1');
      return (
        <div className="tw-content">
          <button type="button" onClick={() => setActive('tab3')}>
            Go to tab 3
          </button>
          <Tabs initialTabId={active} onTabSelected={setActive}>
            <Tabs.Tab id="tab1" label="Tab 1">
              <h2>Tab 1 Content</h2>
            </Tabs.Tab>
            <Tabs.Tab id="tab2" label="Tab 2">
              <h2>Tab 2 Content</h2>
            </Tabs.Tab>
            <Tabs.Tab id="tab3" label="Tab 3">
              <h2>Tab 3 Content</h2>
            </Tabs.Tab>
          </Tabs>
        </div>
      );
    };

    mount(<ControlledTabs />);

    cy.contains('h2', 'Tab 1 Content');
    cy.contains('button', 'Go to tab 3').click();
    cy.contains('h2', 'Tab 3 Content');
    cy.contains('button', 'Tab 2').click();
    cy.contains('h2', 'Tab 2 Content');
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
