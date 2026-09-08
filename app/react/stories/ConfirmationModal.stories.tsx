import React from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { fn } from 'storybook/test';
import { action } from 'storybook/actions';
import { ConfirmationModal } from '#V2/Components/UI/ConfirmationModal.js';
import { Translate } from '#app/I18N/index.js';

const meta = preview.meta({
  title: 'Components/Modal/ConfirmationModal',
  component: ConfirmationModal,
  args: { onAcceptClick: fn(), onCancelClick: fn() },
  parameters: {
    actions: {
      handles: ['change'],
    },
  },
});

const Primary = meta.story({
  render: args => (
    <div className="tw-content">
      <div className="container w-10 h-10">
        <ConfirmationModal
          size="md"
          header={args.header}
          body={args.body}
          acceptButton={args.acceptButton}
          cancelButton={args.cancelButton}
          warningText={args.warningText}
          confirmWord={args.confirmWord}
          usePassword={args.usePassword}
          onAcceptClick={args.onAcceptClick}
          onCancelClick={args.onCancelClick}
          disabled={args.disabled}
        />
      </div>
    </div>
  ),
});

const BasicConfirmation = storyExtend(Primary, {
  args: {
    header: 'Delete Confirmation',
    body: 'Are you sure you want to delete this product?',
    onAcceptClick: action('accepted'),
    onCancelClick: action('canceled'),
  },
});

const TextConfirmation = storyExtend(Primary, {
  args: {
    header: 'Delete Confirmation',
    body: 'Are you sure you want to delete this product?',
    acceptButton: 'Yes',
    cancelButton: 'No, cancel',
    confirmWord: 'CONFIRMATION_TEXT',
    onAcceptClick: action('accepted'),
    onCancelClick: action('canceled'),
  },
});

const WarningConfirmation = storyExtend(Primary, {
  args: {
    header: <Translate>Are you sure</Translate>,
    body: "You can't undo this action",
    acceptButton: 'Yes',
    cancelButton: 'No',
    warningText: 'Other users will be affected by this action',
    confirmWord: 'CONFIRM',
    onAcceptClick: action('accepted'),
    onCancelClick: action('canceled'),
  },
});

const PasswordConfirm = storyExtend(Primary, {
  args: {
    header: 'Confirm action',
    usePassword: true,
    onAcceptClick: action('accepted'),
    onCancelClick: action('canceled'),
  },
});

const DangerConfirmation = storyExtend(Primary, {
  args: {
    header: 'Delete file?',
    body: "Removes this file. If it's the last translation in its document, the document is removed too.",
    acceptButton: 'Delete',
    dangerStyle: true,
    onAcceptClick: action('accepted'),
    onCancelClick: action('canceled'),
  },
});

export {
  BasicConfirmation,
  TextConfirmation,
  WarningConfirmation,
  PasswordConfirm,
  DangerConfirmation,
};
