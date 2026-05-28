/* eslint-disable import/no-default-export */
import React from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { Tabs } from '#V2/Components/UI/Tabs.js';

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
};

export default meta;

type Story = StoryObj<typeof Tabs>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <Tabs
        unmountTabs={args.unmountTabs}
        onTabSelected={args.onTabSelected}
        tabListClassName="md:w-2/3 w-full"
        tabListAriaLabel={args.tabListAriaLabel}
      >
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
export const Basic = {
  ...Primary,
  args: {
    onTabSelected: undefined,
    unmountTabs: undefined,
    tabListAriaLabel: 'Entity detail sections',
  },
};

export const WithCounter: Story = {
  render: args => (
    <div className="tw-content">
      <Tabs
        unmountTabs={args.unmountTabs}
        onTabSelected={args.onTabSelected}
        tabListClassName="md:w-2/3 w-full"
        tabListAriaLabel={args.tabListAriaLabel}
      >
        <Tabs.Tab id="file" label="File">
          <div className="py-4">
            <h2 className="mb-2 text-lg font-medium text-ink">File tab content</h2>
          </div>
        </Tabs.Tab>
        <Tabs.Tab
          id="translations"
          label={
            <span className="inline-flex items-center gap-1">
              Translations
              <span className="rounded bg-(--color-theme-surface-warm) px-1 text-xs font-semibold text-ink-tertiary shrink-0">
                4
              </span>
            </span>
          }
        >
          <div className="py-4">
            <h2 className="mb-2 text-lg font-medium text-ink">Translations tab content</h2>
          </div>
        </Tabs.Tab>
      </Tabs>
    </div>
  ),
  args: {
    onTabSelected: undefined,
    unmountTabs: undefined,
    tabListAriaLabel: 'Entity files side panel tabs',
  },
};
