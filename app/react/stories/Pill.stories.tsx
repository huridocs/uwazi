import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Pill } from 'V2/Components/UI/Pill';

const meta: Meta<typeof Pill> = {
  title: 'Components/Pill',
  component: Pill,
};

type Story = StoryObj<typeof Pill>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <Pill color={args.color} className={args.className}>
        {args.children}
      </Pill>
    </div>
  ),
};

const Basic = {
  ...Primary,
  args: {
    children: <span>Pill Content</span>,
    color: 'gray',
    className: '',
  },
};

export { Basic };

export default meta;
