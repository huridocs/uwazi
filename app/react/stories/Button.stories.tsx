import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from 'V2/Components/UI/Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
};

type Story = StoryObj<typeof Button>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <Button buttonStyle={args.buttonStyle} size={args.size} disabled={args.disabled}>
        {args.children}
      </Button>
    </div>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    buttonStyle: 'primary',
    size: 'medium',
    disabled: false,
    children: 'Button name',
  },
};
export { Basic };
export default meta;
