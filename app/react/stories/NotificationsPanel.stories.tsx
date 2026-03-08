import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { NotificationsPanel } from '#V2/Components/UI/Notifications/NotificationsPanel.js';
import { StatusNotification, StatusTask } from '#V2/atoms/requestStatusAtom.js';

const meta: Meta<typeof NotificationsPanel> = {
  title: 'Components/Notifications/NotificationsPanel',
  component: NotificationsPanel,
};
export default meta;

type Story = StoryObj<typeof NotificationsPanel>;

const ago = (ms: number) => new Date(Date.now() - ms);
const SEC = 1000;
const MIN = 60 * SEC;
const HR = 60 * MIN;
const DAY = 24 * HR;

const sampleNotifications: StatusNotification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Entity saved successfully.',
    message: 'All fields were valid.',
    timestamp: ago(20 * SEC), // → "just now"
  },
  {
    id: '2',
    type: 'info',
    title: 'A new version of Uwazi is available.',
    timestamp: ago(3 * MIN), // → "3 min ago"
  },
  {
    id: '3',
    type: 'warning',
    title: 'Some metadata fields could not be validated.',
    timestamp: ago(20 * MIN), // → "20 min ago"
  },
  {
    id: '4',
    type: 'error',
    title: 'Failed to save entity.',
    message: 'A network timeout occurred. Please try again.',
    details: 'Error: ETIMEDOUT\n  at Socket.connect (net.js:1141:14)\n  at TCPConnectWrap.afterConnect (net.js:1138:16)',
    timestamp: ago(2 * HR), // → "2 hours ago"
  },
  {
    id: '5',
    type: 'success',
    title: 'Batch import completed.',
    message: '120 documents imported.',
    timestamp: ago(25 * HR), // → "1 day ago"
  },
  {
    id: '6',
    type: 'warning',
    title: 'Storage usage above 80%.',
    timestamp: ago(3 * DAY), // → "3 days ago"
  },
  {
    id: '7',
    type: 'error',
    title: 'Scheduled export failed.',
    message: 'Disk quota exceeded.',
    details: 'ENOSPC: no space left on device, write\n  at WriteStream.write (fs.js:812:3)',
    timestamp: ago(10 * DAY), // → locale date+time
  },
];

const sampleTasks: StatusTask[] = [
  { id: 't1', label: 'Uploading document batch...', status: 'running', progress: 58 },
  { id: 't2', label: 'Reindexing entities', status: 'running' },
  { id: 't3', label: 'CSV export', status: 'completed', progress: 100 },
];

const PanelContainer = ({
  notifications,
  tasks,
}: {
  notifications: StatusNotification[];
  tasks: StatusTask[];
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [notifs, setNotifs] = useState(notifications);

  const handleDismiss = (id: string) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
    action('dismiss')(id);
  };

  const handleClear = () => {
    setNotifs([]);
    action('clear-all')();
  };

  return (
    <div className="tw-content">
      <div className="p-4">
        <button
          type="button"
          className="mb-4 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          onClick={() => setIsOpen(o => !o)}
        >
          Toggle Panel
        </button>
        <NotificationsPanel
          isOpen={isOpen}
          notifications={notifs}
          tasks={tasks}
          onClose={() => setIsOpen(false)}
          onDismissNotification={handleDismiss}
          onClearNotifications={handleClear}
        />
      </div>
    </div>
  );
};

const Primary: Story = {
  render: args => (
    <PanelContainer
      notifications={args.notifications ?? []}
      tasks={args.tasks ?? []}
    />
  ),
};

const Empty: Story = {
  ...Primary,
  args: { notifications: [], tasks: [] },
};

const WithNotifications: Story = {
  ...Primary,
  args: { notifications: sampleNotifications, tasks: [] },
};

const WithTasks: Story = {
  ...Primary,
  args: { notifications: [], tasks: sampleTasks },
};

const Mixed: Story = {
  ...Primary,
  args: { notifications: sampleNotifications, tasks: sampleTasks },
};

export { Empty, WithNotifications, WithTasks, Mixed };
