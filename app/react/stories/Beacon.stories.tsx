import React from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { action } from 'storybook/actions';
import { userEvent, within } from 'storybook/test';
import { ThemedBeacon, LegacyBeacon } from '#V2/Components/UI/Notifications/Beacon.js';
import type { ThemedBeaconProps } from '#V2/Components/UI/Notifications/Beacon.js';
import type { StatusNotification, StatusTask } from '#V2/atoms/requestStatusAtom.js';

type BeaconStoryArgs = ThemedBeaconProps & {
  chromeForeground?: string;
  chromeFadeColor?: string;
  chromeFadeStartColor?: string;
};

const meta = preview.type<{ args: BeaconStoryArgs }>().meta({
  title: 'Components/Notifications/Beacon',
  component: ThemedBeacon,
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
});

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

const Primary = meta.story({
  args: { ...baseArgs, overallStatus: 'success' },
  render: args => (
    <div className="tw-content">
      <div className="flex w-[20rem] justify-end rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <ThemedBeacon {...args} />
      </div>
    </div>
  ),
});

const Success = storyExtend(Primary, {
  args: { ...baseArgs, overallStatus: 'success' },
});

const Warning = storyExtend(Primary, {
  args: { ...baseArgs, overallStatus: 'warning' },
});

const Error = storyExtend(Primary, {
  args: { ...baseArgs, overallStatus: 'error' },
});

const Loading = storyExtend(Primary, {
  args: { ...baseArgs, overallStatus: 'loading', hasRunningTasks: true, isLoading: true },
});

const Disconnected = storyExtend(Primary, {
  args: { ...baseArgs, overallStatus: 'error', isConnected: false },
});

const WithRunningTasks = storyExtend(Primary, {
  args: {
    ...baseArgs,
    overallStatus: 'success',
    hasRunningTasks: true,
    tasks: [{ id: '1', status: 'running', label: 'Uploading document batch...', progress: 42 }],
  },
});

const WithNotifications = storyExtend(Primary, {
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
  play: async ({ canvasElement }) => {
    const beacon = within(canvasElement).getByTestId('status-dot');
    await userEvent.hover(beacon);
  },
});

const WithFlash = meta.story({
  render: args => (
    <div className="tw-content">
      <div className="flex w-[20rem] justify-end rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <ThemedBeacon {...args} />
      </div>
    </div>
  ),
  args: {
    ...baseArgs,
    overallStatus: 'success',
    flash: { id: '1', type: 'success', title: 'Entity saved successfully.', phase: 'showing' },
  },
});

const WithFlashOnCustomHeader = meta.story({
  render: args => {
    const chromeForeground = args.chromeForeground ?? '#ffffff';
    const chromeFadeColor = args.chromeFadeColor ?? '#2f4f6f';
    const chromeFadeStartColor = args.chromeFadeStartColor ?? '#2f4f6f';
    return (
      <div className="tw-content">
        <div
          className="flex h-12 w-[24rem] items-center justify-end px-3"
          style={{ background: '#2f4f6f' }}
        >
          <LegacyBeacon
            overallStatus={args.overallStatus}
            isConnected={args.isConnected}
            hasRunningTasks={args.hasRunningTasks}
            isLoading={args.isLoading}
            isPanelOpen={args.isPanelOpen}
            tasks={args.tasks}
            notifications={args.notifications}
            flash={args.flash}
            popKey={args.popKey}
            onClick={args.onClick}
            controlsId={args.controlsId}
            chromeForeground={chromeForeground}
            chromeFadeColor={chromeFadeColor}
            chromeFadeStartColor={chromeFadeStartColor}
          />
        </div>
      </div>
    );
  },
  args: {
    ...baseArgs,
    overallStatus: 'success',
    chromeForeground: '#ffffff',
    chromeFadeColor: '#2f4f6f',
    chromeFadeStartColor: '#2f4f6f',
    flash: { id: '1', type: 'success', title: 'Entity updated', phase: 'showing' },
  },
});

export {
  Success,
  Warning,
  Error,
  Loading,
  Disconnected,
  WithRunningTasks,
  WithNotifications,
  WithFlash,
  WithFlashOnCustomHeader,
};
