import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { StatusDot } from '#V2/Components/UI/Notifications/StatusDot.js';
import { action } from '@storybook/addon-actions';

const meta: Meta<typeof StatusDot> = {
  title: 'Components/Notifications/StatusDot',
  component: StatusDot,
  argTypes: {
    overallStatus: {
      control: { type: 'select' },
      options: ['success', 'warning', 'error', 'loading'],
    },
    isConnected: { control: { type: 'boolean' } },
    hasRunningTasks: { control: { type: 'boolean' } },
  },
};
export default meta;

type Story = StoryObj<typeof StatusDot>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <div className="p-4 inline-flex bg-white border border-gray-200 rounded-lg shadow-sm">
        <StatusDot {...args} onClick={action('dot-clicked')} />
      </div>
    </div>
  ),
};

const Success: Story = {
  ...Primary,
  args: { overallStatus: 'success', isConnected: true, hasRunningTasks: false },
};

const Warning: Story = {
  ...Primary,
  args: { overallStatus: 'warning', isConnected: true, hasRunningTasks: false },
};

const Error: Story = {
  ...Primary,
  args: { overallStatus: 'error', isConnected: true, hasRunningTasks: false },
};

const Loading: Story = {
  ...Primary,
  args: { overallStatus: 'loading', isConnected: true, hasRunningTasks: true },
};

const Disconnected: Story = {
  ...Primary,
  args: { overallStatus: 'error', isConnected: false, hasRunningTasks: false },
};

const WithRunningTasks: Story = {
  ...Primary,
  args: { overallStatus: 'success', isConnected: true, hasRunningTasks: true },
};

export { Success, Warning, Error, Loading, Disconnected, WithRunningTasks };
