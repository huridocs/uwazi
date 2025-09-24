import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { fn } from '@storybook/test';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/Forms.js' ... Remove this comment to see the full error message
import { ColorPicker } from '../../V2/Components/Forms.js';

const meta: Meta<typeof ColorPicker> = {
  title: 'Forms/ColorPicker',
  component: ColorPicker,
  args: {
    onChange: fn(),
  },
  parameters: {
    actions: {
      handles: ['change'],
    },
  },
};

type Story = StoryObj<typeof ColorPicker>;

const Primary: Story = {
  render: args => (
    <div style={{ minHeight: '250px' }} className="tw-content">
      <ColorPicker
        // @ts-expect-error TS(2339): Property 'name' does not exist on type '{}'.
        name={args.name}
        // @ts-expect-error TS(2339): Property 'value' does not exist on type '{}'.
        value={args.value}
        // @ts-expect-error TS(2339): Property 'className' does not exist on type '{}'.
        className={args.className}
        // @ts-expect-error TS(2339): Property 'onChange' does not exist on type '{}'.
        onChange={args.onChange}
        // @ts-expect-error TS(2339): Property 'hasErrors' does not exist on type '{}'.
        hasErrors={args.hasErrors}
      />
    </div>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    name: 'color',
    value: '#C03B22',
    className: '',
    hasErrors: false,
    onChange: action('changed'),
  },
};

export { Basic };

export default meta;
