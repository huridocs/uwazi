import React from 'react';
import 'cypress-axe';
import { mount } from 'cypress/react';
import { composeStories } from '@storybook/react';
import * as stories from '#app/stories/Tabs.stories.js';
import { Tabs, TabButtons, TabPanels } from '#V2/Components/UI/Tabs/index.js';

const { Basic } = composeStories(stories);

const splitTestTabs = [
  { id: 'tab1', label: 'Tab 1', content: <h2>Tab 1 Content</h2> },
  { id: 'tab2', label: 'Tab 2', content: <h2>Tab 2 Content</h2> },
];

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

  it('should update a controlled tab when activeTabId changes', () => {
    const ControlledTabs = () => {
      const [active, setActive] = React.useState('tab1');
      return (
        <div className="tw-content">
          <button type="button" onClick={() => setActive('tab3')}>
            Go to tab 3
          </button>
          <Tabs groupId="controlled-tabs" activeTabId={active} onTabSelected={setActive}>
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

  it('should render split TabButtons and TabPanels from the same groupId', () => {
    const SplitTabs = () => {
      const [active, setActive] = React.useState('tab1');

      return (
        <div className="tw-content flex h-64 flex-col">
          <TabButtons
            groupId="split-test"
            buttons={splitTestTabs.map(({ id, label }) => ({ id, label }))}
            activeTabId={active}
            onTabChange={setActive}
          />
          <TabPanels
            groupId="split-test"
            panels={splitTestTabs.map(({ id, content }) => ({ id, children: content }))}
            unmountInactive={false}
            className="grow overflow-y-auto p-4"
          />
        </div>
      );
    };

    mount(<SplitTabs />);

    cy.contains('h2', 'Tab 1 Content');
    cy.contains('button', 'Tab 2').click();
    cy.contains('h2', 'Tab 2 Content');
  });
});
