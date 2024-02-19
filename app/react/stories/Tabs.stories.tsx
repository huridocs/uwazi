import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Tabs } from 'V2/Components/UI/Tabs';

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
};

type Story = StoryObj<typeof Tabs>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <Tabs unmountTabs={args.unmountTabs} onTabSelected={args.onTabSelected}>
        <Tabs.Tab id="tab1" label="Tab 1">
          <div className="py-4">
            <h2 className="mb-2 text-lg font-medium">Tab 1 Content</h2>
            <p className="text-gray-700">This is tab 1 content</p>
          </div>
        </Tabs.Tab>
        <Tabs.Tab id="tab2" label="Tab 2">
          <div className="py-4">
            <h2 className="mb-2 text-lg font-medium">Tab 2 Content</h2>
            <p className="text-gray-700">This is tab 2 content</p>
          </div>
        </Tabs.Tab>
        <Tabs.Tab id="tab3" label="Tab 3">
          <div className="py-4">
            <h2 className="mb-2 text-lg font-medium">Tab 3 Content</h2>
            <p className="text-gray-700">This is tab 3 content</p>
          </div>
        </Tabs.Tab>
      </Tabs>
    </div>
  ),
};
const Basic = {
  ...Primary,
  args: {
    onTabSelected: () => {},
    unmountTabs: undefined,
  },
};

export { Basic };

export default meta;
