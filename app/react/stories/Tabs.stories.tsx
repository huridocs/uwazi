import React from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { Tabs, TabButtons, TabPanels, splitTabConfig } from '#V2/Components/UI/Tabs/index.js';

const meta = preview.meta({
  title: 'Components/Tabs',
  component: Tabs,
});

const tabContent = (title: string) => (
  <div className="py-4">
    <h2 className="mb-2 text-lg font-medium">{title}</h2>
    <p className="text-ink-secondary">Sample tab content</p>
  </div>
);

const splitStoryTabs = [
  { id: 'tab1', label: 'Tab 1', content: tabContent('Tab 1 Content') },
  { id: 'tab2', label: 'Tab 2', content: tabContent('Tab 2 Content') },
  { id: 'tab3', label: 'Tab 3', content: tabContent('Tab 3 Content') },
];

const Primary = meta.story({
  args: {
    groupId: 'story-basic',
    children: tabContent('Tab 1 Content'),
    onTabSelected: undefined,
    unmountTabs: undefined,
    tabListAriaLabel: 'Entity detail sections',
  },
  render: args => (
    <div className="tw-content">
      <Tabs
        groupId="story-basic"
        unmountTabs={args.unmountTabs}
        onTabSelected={args.onTabSelected}
        tabListClassName="md:w-2/3 w-full"
        tabListAriaLabel={args.tabListAriaLabel}
      >
        <Tabs.Tab id="tab1" label="Tab 1">
          {tabContent('Tab 1 Content')}
        </Tabs.Tab>
        <Tabs.Tab id="tab2" label="Tab 2">
          {tabContent('Tab 2 Content')}
        </Tabs.Tab>
        <Tabs.Tab id="tab3" label="Tab 3">
          {tabContent('Tab 3 Content')}
        </Tabs.Tab>
      </Tabs>
    </div>
  ),
});

const Basic = storyExtend(Primary, {
  args: {
    onTabSelected: undefined,
    unmountTabs: undefined,
    tabListAriaLabel: 'Entity detail sections',
  },
});

const WithCounter = meta.story({
  args: {
    groupId: 'story-with-counter',
    children: tabContent('File tab content'),
    onTabSelected: undefined,
    unmountTabs: undefined,
    tabListAriaLabel: 'Entity files side panel tabs',
  },
  render: args => (
    <div className="tw-content">
      <Tabs
        groupId="story-with-counter"
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
});

const SplitLayoutDemo = () => {
  const [activeTab, setActiveTab] = React.useState('tab1');
  const { buttons, panels } = splitTabConfig(splitStoryTabs);

  return (
    <div className="tw-content flex h-96 flex-col gap-0 border border-border">
      <header className="border-b border-border">
        <TabButtons
          groupId="story-split"
          buttons={buttons}
          activeTabId={activeTab}
          onTabChange={setActiveTab}
          tabListAriaLabel="Split layout tabs"
        />
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto p-4">
        <TabPanels groupId="story-split" panels={panels} unmountInactive={false} />
      </main>
    </div>
  );
};

const SplitLayout = meta.story({
  render: () => <SplitLayoutDemo />,
});

export { Basic, WithCounter, SplitLayout };
