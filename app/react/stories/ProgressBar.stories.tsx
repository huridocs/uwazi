import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ProgressBar } from 'V2/Components/UI';

const meta: Meta<typeof ProgressBar> = {
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
};

type Story = StoryObj<typeof ProgressBar>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <ProgressBar {...args} />
    </div>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    progress: 50,
    color: 'gray',
  },
};

export { Basic };

export default meta;
