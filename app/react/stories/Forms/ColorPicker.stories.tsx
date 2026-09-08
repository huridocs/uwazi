import React from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { action } from 'storybook/actions';
import { fn } from 'storybook/test';
import { ColorPicker } from '#V2/Components/Forms/index.js';

const meta = preview.meta({
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
});

const Primary = meta.story({
  args: {
    name: 'color',
    value: '#C03B22',
    className: '',
    hasErrors: false,
    onChange: fn(),
  },
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
});

const Basic = storyExtend(Primary, {
  args: {
    name: 'color',
    value: '#C03B22',
    className: '',
    hasErrors: false,
    onChange: action('changed'),
  },
});

export { Basic };
