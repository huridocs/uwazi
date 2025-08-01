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
      options: ['gray', 'primary', 'secondary', 'success', 'danger', 'warning'],
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

const Complete: Story = {
  ...Primary,
  args: {
    progress: 100,
    color: 'success',
  },
};

const Empty: Story = {
  ...Primary,
  args: {
    progress: 0,
    color: 'gray',
  },
};

const Danger: Story = {
  ...Primary,
  args: {
    progress: 75,
    color: 'error',
  },
};

const Warning: Story = {
  ...Primary,
  args: {
    progress: 25,
    color: 'warning',
  },
};

export { Basic, Complete, Empty, Danger, Warning };

export default meta;
