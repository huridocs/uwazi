import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { action } from 'storybook/actions';
import { Beacon } from '#V2/Components/UI/Notifications/Beacon.js';
import type { StatusNotification, StatusTask } from '#V2/atoms/requestStatusAtom.js';

const meta: Meta<typeof Beacon> = {
  title: 'Components/Notifications/Beacon',
  component: Beacon,
  argTypes: {
    overallStatus: {
      control: { type: 'select' },
      options: ['success', 'warning', 'error', 'loading'],
    },
    isConnected: { control: { type: 'boolean' } },
    hasRunningTasks: { control: { type: 'boolean' } },
    isLoading: { control: { type: 'boolean' } },
    isPanelOpen: { control: { type: 'boolean' } },
  },
};

type Story = StoryObj<typeof Beacon>;

const baseArgs = {
  isConnected: true,
  hasRunningTasks: false,
  isLoading: false,
  isPanelOpen: false,
  tasks: [] as StatusTask[],
  notifications: [] as StatusNotification[],
  flash: null,
  onClick: action('beacon-clicked'),
  controlsId: 'notifications-panel-dialog',
};

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <div className="inline-flex rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <Beacon {...args} />
      </div>
    </div>
  ),
};

const Success: Story = {
  ...Primary,
  args: { ...baseArgs, overallStatus: 'success' },
};

const Warning: Story = {
  ...Primary,
  args: { ...baseArgs, overallStatus: 'warning' },
};

const Error: Story = {
  ...Primary,
  args: { ...baseArgs, overallStatus: 'error' },
};

const Loading: Story = {
  ...Primary,
  args: { ...baseArgs, overallStatus: 'loading', hasRunningTasks: true, isLoading: true },
};

const Disconnected: Story = {
  ...Primary,
  args: { ...baseArgs, overallStatus: 'error', isConnected: false },
};

const WithRunningTasks: Story = {
  ...Primary,
  args: {
    ...baseArgs,
    overallStatus: 'success',
    hasRunningTasks: true,
    tasks: [{ id: '1', status: 'running', label: 'Uploading document batch...', progress: 42 }],
  },
};

const WithNotifications: Story = {
  ...Primary,
  args: {
    ...baseArgs,
    overallStatus: 'success',
    notifications: [
      {
        id: '1',
        type: 'success',
        title: 'Entity saved successfully.',
        timestamp: new Date(),
      },
      {
        id: '2',
        type: 'warning',
        title: 'Some fields could not be validated.',
        timestamp: new Date(),
      },
    ],
  },
};

const WithFlash: Story = {
  ...Primary,
  args: {
    ...baseArgs,
    overallStatus: 'success',
    flash: { id: '1', type: 'success', title: 'Entity saved successfully.', phase: 'showing' },
  },
};

export default meta;

export {
  Success,
  Warning,
  Error,
  Loading,
  Disconnected,
  WithRunningTasks,
  WithNotifications,
  WithFlash,
};
