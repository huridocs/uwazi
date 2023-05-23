import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Card } from 'V2/Components/UI';

const meta: Meta<typeof Card> = {
  title: 'Components/Cards',
  component: Card,
};

type Story = StoryObj<typeof Card>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <Card title={args.title}>{args.children}</Card>
    </div>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    children: 'Card contents',
    title: 'Card title',
  },
};

export { Basic };

export default meta;
