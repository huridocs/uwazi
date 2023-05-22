import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Pill } from 'V2/Components/UI/Pill';

const meta: Meta<typeof Pill> = {
  title: 'Components/Pill',
  component: Pill,
};

type Story = StoryObj<typeof Pill>;

const PillStory: Story = {
  render: args => (
    <div className="tw-content">
      <Pill color={args.color}>{args.children}</Pill>
    </div>
  ),
};

const Basic = {
  ...PillStory,
  args: {
    children: <span>Pill Content</span>,
    color: 'gray',
  },
};

export { Basic };

export default meta;
