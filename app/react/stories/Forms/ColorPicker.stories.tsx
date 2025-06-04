import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { fn } from '@storybook/test';
import { ColorPicker } from 'app/V2/Components/Forms';

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

export default meta;
