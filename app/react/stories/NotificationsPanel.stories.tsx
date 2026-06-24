import React, { useRef } from 'react';
import { createStore, Provider } from 'jotai';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { NotificationsPanel } from '#V2/Components/UI/Notifications/NotificationsPanel.js';
import { requestStatusAtom, type RequestStatusState } from '#V2/atoms/requestStatusAtom.js';

const meta: Meta<typeof NotificationsPanel> = {
  title: 'Components/Notifications/NotificationsPanel',
  component: NotificationsPanel,
};

type Story = StoryObj<typeof NotificationsPanel>;

const ago = (ms: number) => new Date(Date.now() - ms);
const SEC = 1000;
const MIN = 60 * SEC;
const HR = 60 * MIN;
const DAY = 24 * HR;

const baseState: RequestStatusState = {
  notifications: [],
  unreadNotificationIds: [],
  tasks: [],
  isConnected: true,
  isPanelOpen: true,
  isLoading: false,
};

const notificationsState: RequestStatusState = {
  ...baseState,
  notifications: [
    {
      id: 'success-new',
      type: 'success',
      title: 'Entity saved successfully.',
      message: 'All fields were valid.',
      timestamp: ago(20 * SEC),
    },
    {
      id: 'info-new',
      type: 'info',
      title: 'A new version of Uwazi is available.',
      timestamp: ago(3 * MIN),
    },
    {
      id: 'warning-new',
      type: 'warning',
      title: 'Some fields could not be validated.',
      message: 'Check highlighted fields and try again.',
      timestamp: ago(20 * MIN),
    },
    {
      id: 'error-today',
      type: 'error',
      title: 'Failed to save entity.',
      message: 'A network timeout occurred. Please retry.',
      details: 'Error: ETIMEDOUT\n  at Socket.connect (net.js:1141:14)',
      timestamp: ago(2 * HR),
    },
    {
      id: 'success-earlier',
      type: 'success',
      title: 'Batch import completed.',
      message: '120 documents imported.',
      timestamp: ago(25 * HR),
    },
    {
      id: 'error-earlier',
      type: 'error',
      title: 'Scheduled export failed.',
      message: 'Disk quota exceeded.',
      details: 'ENOSPC: no space left on device, write\n  at WriteStream.write (fs.js:812:3)',
      timestamp: ago(10 * DAY),
    },
  ],
  unreadNotificationIds: ['success-new', 'info-new', 'warning-new'],
};

const tasksState: RequestStatusState = {
  ...baseState,
  tasks: [
    { id: 'uploading', label: 'Uploading document batch...', progress: 25, status: 'running' },
    { id: 'processing', label: 'Processing PDFs...', progress: 75, status: 'running' },
    { id: 'completed', label: 'Indexing completed.', progress: 100, status: 'completed' },
  ],
};

const mixedState: RequestStatusState = {
  ...notificationsState,
  tasks: tasksState.tasks,
};

const DemoPanel = ({ state }: { state: RequestStatusState }) => {
  const initializedRef = useRef(false);
  const storeRef = useRef(createStore());

  if (!initializedRef.current) {
    initializedRef.current = true;
    storeRef.current.set(requestStatusAtom, state);
  }

  return (
    <Provider store={storeRef.current}>
      <div className="tw-content h-[700px] bg-warm">
        <NotificationsPanel />
      </div>
    </Provider>
  );
};

const Primary: Story = {
  render: () => <DemoPanel state={mixedState} />,
};

const Empty: Story = {
  render: () => <DemoPanel state={baseState} />,
};

const WithNotifications: Story = {
  render: () => <DemoPanel state={notificationsState} />,
};

const WithTasks: Story = {
  render: () => <DemoPanel state={tasksState} />,
};

const Mixed: Story = {
  ...Primary,
};

export default meta;

export { Empty, WithNotifications, WithTasks, Mixed };
