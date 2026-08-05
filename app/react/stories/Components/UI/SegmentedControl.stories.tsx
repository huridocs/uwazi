import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';
import {
  LayoutListIcon,
  ListTreeIcon,
  NetworkIcon,
} from '#V2/Components/CustomIcons/RelationshipsPanelIcons.js';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlRoot,
} from '#V2/Components/UI/SegmentedControl/index.js';

const meta: Meta<typeof SegmentedControl> = {
  title: 'Components/UI/SegmentedControl',
  component: SegmentedControl,
};

type Story = StoryObj<typeof SegmentedControl>;

const viewOptions = [
  { id: 'list' as const, title: 'List', Icon: LayoutListIcon },
  { id: 'tree' as const, title: 'Tree', Icon: ListTreeIcon },
  { id: 'graph' as const, title: 'Graph', Icon: NetworkIcon },
];

const OptionsApiPreview = () => {
  const [value, setValue] = useState<'list' | 'tree' | 'graph'>('list');
  return (
    <div className="tw-content p-4">
      <SegmentedControl ariaLabel="View" value={value} options={viewOptions} onChange={setValue} />
    </div>
  );
};

const ComposedPreview = () => {
  const [value, setValue] = useState<'list' | 'tree' | 'graph'>('list');
  return (
    <div className="tw-content p-4">
      <SegmentedControlRoot
        ariaLabel="View"
        value={value}
        onValueChange={next => setValue(next as typeof value)}
      >
        {viewOptions.map(option => (
          <SegmentedControlItem key={option.id} value={option.id} ariaLabel={option.title}>
            <option.Icon className="h-3 w-3" aria-hidden />
          </SegmentedControlItem>
        ))}
      </SegmentedControlRoot>
    </div>
  );
};

const OptionsApi: Story = {
  render: () => <OptionsApiPreview />,
};

const Composed: Story = {
  render: () => <ComposedPreview />,
};

const Disabled: Story = {
  render: () => (
    <div className="tw-content p-4">
      <SegmentedControl
        ariaLabel="View"
        value="list"
        disabled
        options={viewOptions}
        onChange={fn()}
      />
    </div>
  ),
};

export default meta;
export { OptionsApi, Composed, Disabled };
