import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { fn } from '@storybook/test';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/Forms.js' ... Remove this comment to see the full error message
import { Checkbox } from '../../V2/Components/Forms.js';

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
      // @ts-expect-error TS(2339): Property 'label' does not exist on type '{}'.
      label={args.label}
      // @ts-expect-error TS(2339): Property 'checked' does not exist on type '{}'.
      checked={args.checked}
      // @ts-expect-error TS(2339): Property 'name' does not exist on type '{}'.
      name={args.name}
      // @ts-expect-error TS(2339): Property 'onChange' does not exist on type '{}'.
      onChange={args.onChange}
      // @ts-expect-error TS(2339): Property 'className' does not exist on type '{}'.
      className={args.className}
      // @ts-expect-error TS(2339): Property 'disabled' does not exist on type '{}'.
      disabled={args.disabled}
    />
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    label: 'Uwazi is awesome',
    name: 'awesomeness',
    disabled: false,
    checked: false,
    className: '',
    onChange: action('changed'),
  },
};

export { Basic };

export default meta;
