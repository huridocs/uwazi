// oxlint-disable react/jsx-props-no-spreading
import React from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { ProgressBar } from '#V2/Components/UI/index.js';

const meta = preview.meta({
  title: 'Components/ProgressBar',
  component: ProgressBar,
  argTypes: {
    progress: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Progress percentage (0-100)',
    },
    color: {
      control: { type: 'select' },
      options: ['gray', 'primary', 'success', 'error', 'warning'],
      description: 'Color theme of the progress bar',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
});

const Primary = meta.story({
  args: {
    progress: 50,
    color: 'gray',
  },
  render: args => (
    <div className="tw-content">
      <ProgressBar {...args} />
    </div>
  ),
});

const Basic = storyExtend(Primary, {
  args: {
    progress: 50,
    color: 'gray',
  },
});

export { Basic };
