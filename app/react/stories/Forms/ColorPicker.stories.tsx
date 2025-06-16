import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { action } from '@storybook/addon-actions';
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
    <div className="tw-content" style={{ height: '300px' }}>
      <ColorPicker
        name={args.name}
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
    className: '',
    hasErrors: false,
    onChange: action('changed'),
  },
};

export { Basic };

export default meta;
