import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Tabs } from 'V2/Components/UI/Tabs';

const TabsStory = {
  title: 'Components/Tabs',
  component: Tabs,
};

const Template: ComponentStory<typeof Tabs> = args => (
  <div className="tw-content">
    <Tabs onTabSelected={args.onTabSelected}>
      <Tabs.Tab id="tab1" label="Tab 1">
        <div className="py-4">
          <h2 className="text-lg font-medium mb-2">Tab 1 Content</h2>
          <p className="text-gray-700">This is tab 1 content</p>
        </div>
      </Tabs.Tab>
      <Tabs.Tab id="tab2" label="Tab 2">
        <div className="py-4">
          <h2 className="text-lg font-medium mb-2">Tab 2 Content</h2>
          <p className="text-gray-700">This is tab 2 content</p>
        </div>
      </Tabs.Tab>
      <Tabs.Tab id="tab3" label="Tab 3">
        <div className="py-4">
          <h2 className="text-lg font-medium mb-2">Tab 3 Content</h2>
          <p className="text-gray-700">This is tab 3 content</p>
        </div>
      </Tabs.Tab>
    </Tabs>
  </div>
);

const Basic = Template.bind({});

Basic.args = {
  onTabSelected: () => {},
};

export { Basic };

export default TabsStory as ComponentMeta<typeof Tabs>;
