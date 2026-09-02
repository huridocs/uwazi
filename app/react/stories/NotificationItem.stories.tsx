// oxlint-disable react/jsx-props-no-spreading
import React from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { action } from 'storybook/actions';
import { NotificationItem } from '#V2/Components/UI/Notifications/NotificationItem.js';
import { StatusNotification } from '#V2/atoms/requestStatusAtom.js';

const meta = preview.meta({
  title: 'Components/Notifications/NotificationItem',
  component: NotificationItem,
});

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

const Primary = meta.story({
  args: {
    notification: makeNotification(
      'success',
      'Entity saved successfully.',
      'All fields were valid.'
    ),
    onDismiss: action('dismiss'),
  },
  render: args => (
    <div className="tw-content">
      <div className="max-w-sm p-4">
        <NotificationItem {...args} onDismiss={action('dismiss')} />
      </div>
    </div>
  ),
});

const SuccessNotification = storyExtend(Primary, {
  args: {
    notification: makeNotification(
      'success',
      'Entity saved successfully.',
      'All fields were valid.'
    ),
  },
});

const WarningNotification = storyExtend(Primary, {
  args: {
    notification: makeNotification(
      'warning',
      'Some fields could not be validated.',
      'Check the highlighted fields and try again.'
    ),
  },
});

const ErrorNotification = storyExtend(Primary, {
  args: {
    notification: makeNotification(
      'error',
      'Failed to connect to the server.',
      'Please check your network connection and try again.'
    ),
  },
});

const ErrorWithDetails = storyExtend(Primary, {
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
});

const InfoNotification = storyExtend(Primary, {
  args: {
    notification: makeNotification('info', 'A new version of Uwazi is available.'),
  },
});

export {
  SuccessNotification,
  WarningNotification,
  ErrorNotification,
  ErrorWithDetails,
  InfoNotification,
};
