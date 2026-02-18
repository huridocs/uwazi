import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Card } from '#V2/Components/UI/index.js';

const meta: Meta<typeof Card> = {
  title: 'Components/Cards',
  component: Card,
};
export default meta;

type Story = StoryObj<typeof Card>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <Card title={args.title} color={args.color} className={args.className}>
        {args.children}
      </Card>
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
