import React, { useEffect, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { NotificationsPanel } from '#V2/Components/UI/Notifications/NotificationsPanel.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';

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

const DemoPanel = () => {
  const initializedRef = useRef(false);
  const { notify, registerTask, togglePanel } = useRequestStatus();

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    notify(
      'success',
      'Entity saved successfully.',
      'All fields were valid.',
      undefined,
      ago(20 * SEC)
    );
    notify(
      'error',
      'Failed to save entity.',
      'A network timeout occurred. Please try again.',
      'Error: ETIMEDOUT',
      ago(2 * HR)
    );
    registerTask('storybook-task-1', 'Uploading document batch...');
    togglePanel();
  }, [notify, registerTask, togglePanel]);

  return <NotificationsPanel />;
};

const Primary: Story = {
  render: () => <DemoPanel />,
};

const Empty: Story = {
  ...Primary,
};

const WithNotifications: Story = {
  ...Primary,
};

const WithTasks: Story = {
  ...Primary,
};

const Mixed: Story = {
  ...Primary,
};

export { Empty, WithNotifications, WithTasks, Mixed };
