import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';
import { FilterDrawerButton } from '#V2/Components/UI/FilterDrawerButton.js';

const meta: Meta<typeof FilterDrawerButton> = {
  title: 'Components/UI/FilterDrawerButton',
  component: FilterDrawerButton,
  args: {
    activeCount: 0,
    onClick: fn(),
  },
};

type Story = StoryObj<typeof FilterDrawerButton>;

const Inactive: Story = {
  render: args => (
    <div className="tw-content p-4">
      <FilterDrawerButton {...args} />
    </div>
  ),
};

const Active: Story = {
  ...Inactive,
  args: {
    activeCount: 3,
  },
};

export default meta;
export { Inactive, Active };
