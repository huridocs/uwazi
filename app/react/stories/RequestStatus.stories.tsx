import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RequestStatus } from '#V2/Components/UI/Notifications/RequestStatus.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';

const meta: Meta = {
  title: 'Components/Notifications/RequestStatus',
};
export default meta;

type Story = StoryObj;

const statusColors: Record<string, string> = {
  success: 'text-green-600',
  warning: 'text-yellow-500',
  error: 'text-pink-600',
  loading: 'text-indigo-600',
};

const ActionButton = ({
  label,
  onClick,
  variant = 'default',
}: {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'danger';
}) => {
  const variantClass: Record<string, string> = {
    default: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300',
    success: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-300',
    warning: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-300',
    error: 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-300',
    info: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-300',
    danger: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-300',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-md border cursor-pointer transition-colors ${variantClass[variant]}`}
    >
      {label}
    </button>
  );
};

const Playground = () => {
  const {
    notify,
    registerTask,
    updateTask,
    endTask,
    clearAll,
    setConnected,
    startLoading,
    endLoading,
    overallStatus,
    isConnected,
    isLoading,
    hasRunningTasks,
    notifications,
    tasks,
  } = useRequestStatus();

  const ago = (ms: number) => new Date(Date.now() - ms);
  const SEC = 1000;
  const MIN = 60 * SEC;
  const HR = 60 * MIN;
  const DAY = 24 * HR;

  const loadDemoNotifications = () => {
    notify('success', 'Entity saved successfully.', 'All fields were valid.', undefined, ago(10 * SEC));
    notify('info', 'A new version of Uwazi is available.', undefined, undefined, ago(3 * MIN));
    notify('warning', 'Some fields could not be validated.', 'Check highlighted fields and try again.', undefined, ago(20 * MIN));
    notify('error', 'Failed to save entity.', 'A network timeout occurred. Please retry.', 'Error: ETIMEDOUT\n  at Socket.connect (net.js:1141:14)', ago(2 * HR));
    notify('success', 'Batch import completed.', '120 documents imported.', undefined, ago(25 * HR));
    notify('warning', 'Storage usage above 80%.', undefined, undefined, ago(3 * DAY));
    notify('error', 'Scheduled export failed.', 'Disk quota exceeded.', 'ENOSPC: no space left on device, write\n  at WriteStream.write (fs.js:812:3)', ago(10 * DAY));
  };

  const TASK_ID = 'story-task';

  return (
    <div className="tw-content h-[700px] overflow-hidden bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto h-full overflow-y-auto flex flex-col gap-6">

        {/* Header: dot lives here */}
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm">
          <span className="text-sm font-semibold text-gray-600">RequestStatus Playground</span>
          <RequestStatus />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Notifications */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Notifications
            </h2>
            <div className="flex flex-wrap gap-2">
              <ActionButton
                label="Add Success"
                variant="success"
                onClick={() => notify('success', 'Entity saved successfully.', 'All fields were valid.')}
              />
              <ActionButton
                label="Add Warning"
                variant="warning"
                onClick={() => notify('warning', 'Some fields could not be validated.', 'Check highlighted fields and try again.')}
              />
              <ActionButton
                label="Add Error"
                variant="error"
                onClick={() => notify('error', 'Failed to save entity.', 'A network timeout occurred. Please retry.', 'Error: ETIMEDOUT\n  at Socket.connect (net.js:1141:14)\n  at TCPConnectWrap.afterConnect (net.js:1138:16)')}
              />
              <ActionButton
                label="Add Info"
                variant="info"
                onClick={() => notify('info', 'A new version of Uwazi is available.')}
              />
              <ActionButton
                label="Load Demo Notifications"
                variant="info"
                onClick={loadDemoNotifications}
              />
              <ActionButton
                label="Clear All"
                variant="danger"
                onClick={clearAll}
              />
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Tasks
            </h2>
            <div className="flex flex-wrap gap-2">
              <ActionButton
                label="Register Task"
                variant="info"
                onClick={() => registerTask(TASK_ID, 'Uploading document batch...', 0)}
              />
              <ActionButton
                label="Update → 25%"
                onClick={() => updateTask(TASK_ID, { progress: 25 })}
              />
              <ActionButton
                label="Update → 50%"
                onClick={() => updateTask(TASK_ID, { progress: 50 })}
              />
              <ActionButton
                label="Update → 75%"
                onClick={() => updateTask(TASK_ID, { progress: 75 })}
              />
              <ActionButton
                label="End Task (complete)"
                variant="success"
                onClick={() => endTask(TASK_ID, 'completed')}
              />
              <ActionButton
                label="End Task (failed)"
                variant="error"
                onClick={() => endTask(TASK_ID, 'failed')}
              />
            </div>
          </div>

          {/* Loading */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Loading State
            </h2>
            <p className="text-xs text-gray-400">
              Triggers the animated 3-dot state. Independent from tasks.
            </p>
            <div className="flex gap-2">
              <ActionButton
                label="Start Loading"
                variant="info"
                onClick={startLoading}
              />
              <ActionButton
                label="End Loading"
                variant="default"
                onClick={endLoading}
              />
            </div>
          </div>

          {/* Connection */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Connection
            </h2>
            <div className="flex gap-2">
              <ActionButton
                label="Simulate Disconnect"
                variant="error"
                onClick={() => setConnected(false)}
              />
              <ActionButton
                label="Reconnect"
                variant="success"
                onClick={() => setConnected(true)}
              />
            </div>
          </div>

          {/* Live state readout */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Live State
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <dt className="text-gray-500">overallStatus</dt>
              <dd className={`font-mono font-semibold ${statusColors[overallStatus] ?? 'text-gray-700'}`}>
                {overallStatus}
              </dd>

              <dt className="text-gray-500">isLoading</dt>
              <dd className={`font-mono font-semibold ${isLoading ? 'text-indigo-600' : 'text-gray-400'}`}>
                {String(isLoading)}
              </dd>

              <dt className="text-gray-500">isConnected</dt>
              <dd className={`font-mono font-semibold ${isConnected ? 'text-green-600' : 'text-pink-600'}`}>
                {String(isConnected)}
              </dd>

              <dt className="text-gray-500">hasRunningTasks</dt>
              <dd className={`font-mono font-semibold ${hasRunningTasks ? 'text-indigo-600' : 'text-gray-400'}`}>
                {String(hasRunningTasks)}
              </dd>

              <dt className="text-gray-500">notifications</dt>
              <dd className="font-mono font-semibold text-gray-700">{notifications.length}</dd>

              <dt className="text-gray-500">tasks</dt>
              <dd className="font-mono font-semibold text-gray-700">{tasks.length}</dd>
            </dl>
          </div>

        </div>

        {/* Instructions */}
        <p className="text-xs text-gray-400 text-center">
          Click the status dot (top right) to open the notifications panel.
        </p>
      </div>
    </div>
  );
};

const PlaygroundStory: Story = {
  render: () => <Playground />,
};

export { PlaygroundStory as Playground };
