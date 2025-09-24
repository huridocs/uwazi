import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { action } from '@storybook/addon-actions';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/UI/Confirm... Remove this comment to see the full error message
import { ConfirmationModal } from '../../V2/Components/UI/ConfirmationModal.js';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';

const meta: Meta<typeof ConfirmationModal> = {
  title: 'Components/Modal/ConfirmationModal',
  component: ConfirmationModal,
  args: { onAcceptClick: fn(), onCancelClick: fn() },
  parameters: {
    actions: {
      handles: ['change'],
    },
  },
};

type Story = StoryObj<typeof ConfirmationModal>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <div className="container w-10 h-10">
        <ConfirmationModal
          size="md"
          // @ts-expect-error TS(2339): Property 'header' does not exist on type '{}'.
          header={args.header}
          // @ts-expect-error TS(2339): Property 'body' does not exist on type '{}'.
          body={args.body}
          // @ts-expect-error TS(2339): Property 'acceptButton' does not exist on type '{}... Remove this comment to see the full error message
          acceptButton={args.acceptButton}
          // @ts-expect-error TS(2339): Property 'cancelButton' does not exist on type '{}... Remove this comment to see the full error message
          cancelButton={args.cancelButton}
          // @ts-expect-error TS(2339): Property 'warningText' does not exist on type '{}'... Remove this comment to see the full error message
          warningText={args.warningText}
          // @ts-expect-error TS(2339): Property 'confirmWord' does not exist on type '{}'... Remove this comment to see the full error message
          confirmWord={args.confirmWord}
          // @ts-expect-error TS(2339): Property 'usePassword' does not exist on type '{}'... Remove this comment to see the full error message
          usePassword={args.usePassword}
          // @ts-expect-error TS(2339): Property 'onAcceptClick' does not exist on type '{... Remove this comment to see the full error message
          onAcceptClick={args.onAcceptClick}
          // @ts-expect-error TS(2339): Property 'onCancelClick' does not exist on type '{... Remove this comment to see the full error message
          onCancelClick={args.onCancelClick}
          // @ts-expect-error TS(2339): Property 'disabled' does not exist on type '{}'.
          disabled={args.disabled}
        />
      </div>
    </div>
  ),
};

const BasicConfirmation: Story = {
  ...Primary,
  args: {
    header: 'Delete Confirmation',
    body: 'Are you sure you want to delete this product?',
    onAcceptClick: action('accepted'),
    onCancelClick: action('canceled'),
  },
};

const TextConfirmation: Story = {
  ...Primary,
  args: {
    header: 'Delete Confirmation',
    body: 'Are you sure you want to delete this product?',
    acceptButton: 'Yes',
    cancelButton: 'No, cancel',
    confirmWord: 'CONFIRMATION_TEXT',
    onAcceptClick: action('accepted'),
    onCancelClick: action('canceled'),
  },
};

const WarningConfirmation: Story = {
  ...Primary,
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
};

const PasswordConfirm: Story = {
  ...Primary,
  args: {
    header: 'Confirm action',
    usePassword: true,
    onAcceptClick: action('accepted'),
    onCancelClick: action('canceled'),
  },
};

export { BasicConfirmation, TextConfirmation, WarningConfirmation, PasswordConfirm };

export default meta;
