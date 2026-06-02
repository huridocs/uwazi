import React from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { action } from 'storybook/actions';
import { fn } from 'storybook/test';
import { ColorPicker } from '#V2/Components/Forms/index.js';

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
export default meta;

type Story = StoryObj<typeof ColorPicker>;

const Primary: Story = {
  render: args => (
    <div style={{ minHeight: '250px' }} className="tw-content">
      <ColorPicker
        name={args.name}
        value={args.value}
        className={args.className}
        onChange={args.onChange}
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
