import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { NotificationItem } from '#V2/Components/UI/Notifications/NotificationItem.js';
import { StatusNotification } from '#V2/atoms/requestStatusAtom.js';

const meta: Meta<typeof NotificationItem> = {
  title: 'Components/Notifications/NotificationItem',
  component: NotificationItem,
};
export default meta;

type Story = StoryObj<typeof NotificationItem>;

const makeNotification = (
  type: StatusNotification['type'],
  title: string,
  message?: string,
  details?: string
): StatusNotification => ({
  id: '1',
  type,
  title,
  message,
  details,
  timestamp: new Date(),
});

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <div className="max-w-sm p-4">
        <NotificationItem {...args} onDismiss={action('dismiss')} />
      </div>
    </div>
  ),
};

const SuccessNotification: Story = {
  ...Primary,
  args: {
    notification: makeNotification('success', 'Entity saved successfully.', 'All fields were valid.'),
  },
};

const WarningNotification: Story = {
  ...Primary,
  args: {
    notification: makeNotification(
      'warning',
      'Some fields could not be validated.',
      'Check the highlighted fields and try again.'
    ),
  },
};

const ErrorNotification: Story = {
  ...Primary,
  args: {
    notification: makeNotification(
      'error',
      'Failed to connect to the server.',
      'Please check your network connection and try again.'
    ),
  },
};

const ErrorWithDetails: Story = {
  ...Primary,
  args: {
    notification: makeNotification(
      'error',
      'Unhandled exception during import.',
      'The process crashed after processing 42 documents.',
      `TypeError: Cannot read properties of undefined (reading 'metadata')
  at processDocument (import-worker.js:84:22)
  at async Promise.all (index 12)
  at importBatch (import-worker.js:201:5)`
    ),
  },
};

const InfoNotification: Story = {
  ...Primary,
  args: {
    notification: makeNotification('info', 'A new version of Uwazi is available.'),
  },
};

export { SuccessNotification, WarningNotification, ErrorNotification, ErrorWithDetails, InfoNotification };
