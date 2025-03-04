import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { fn } from '@storybook/test';
import { Checkbox } from 'app/V2/Components/Forms';

const meta: Meta<typeof Checkbox> = {
  title: 'Forms/Checkbox',
  component: Checkbox,
  args: {
    onChange: fn(),
  },
};

type Story = StoryObj<typeof Checkbox>;

const Primary: Story = {
  render: args => (
    <Checkbox
      label={args.label}
      defaultChecked={args.defaultChecked}
      checked={args.checked}
      name={args.name}
      onChange={args.onChange}
      className={args.className}
      disabled={args.disabled}
    />
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    label: 'Uwazi is awesome',
    name: 'awesomeness',
    defaultChecked: false,
    disabled: false,
    checked: false,
    className: '',
    onChange: action('changed'),
  },
};

export { Basic };

export default meta;
