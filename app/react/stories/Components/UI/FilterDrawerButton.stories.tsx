import React from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { fn } from 'storybook/test';
import { FilterDrawerButton } from '#V2/Components/UI/FilterDrawerButton.js';

const meta = preview.meta({
  title: 'Components/UI/FilterDrawerButton',
  component: FilterDrawerButton,
  args: {
    activeCount: 0,
    onClick: fn(),
  },
});

const Inactive = meta.story({
  args: {
    activeCount: 0,
    onClick: fn(),
  },
  render: args => (
    <div className="tw-content p-4">
      <FilterDrawerButton activeCount={args.activeCount} onClick={args.onClick} />
    </div>
  ),
});

const Active = storyExtend(Inactive, {
  args: {
    activeCount: 3,
  },
});
export { Inactive, Active };
