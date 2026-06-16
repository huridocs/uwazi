import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';
import { FiltersButton } from '#V2/Components/UI/FiltersButton.js';

const meta: Meta<typeof FiltersButton> = {
  title: 'Components/UI/FiltersButton',
  component: FiltersButton,
  args: {
    activeCount: 0,
    onClick: fn(),
  },
};

type Story = StoryObj<typeof FiltersButton>;

const Inactive: Story = {
  render: args => (
    <div className="tw-content p-4">
      <FiltersButton {...args} />
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
