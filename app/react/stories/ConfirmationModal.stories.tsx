import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Provider } from 'react-redux';
import { Modal } from 'V2/Components/UI/Modal';
import { ConfirmationModal } from 'app/V2/Components/UI/ConfirmationModal';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { Translate } from 'app/I18N';

const ConfirmationModalStory = {
  title: 'Components/Modal',
  component: Modal,
  argTypes: {
    onAcceptClick: { action: 'onAcceptClick' },
    onCancelClick: { action: 'onCancelClick' },
  },
  parameters: {
    actions: {
      handles: ['change'],
    },
  },
};

const Template: ComponentStory<typeof ConfirmationModal> = args => (
  <Provider store={createStore()}>
    <div className="tw-content">
      <div className="container w-10 h10">
        <ConfirmationModal
          header={args.header}
          body={args.body}
          acceptButton={args.acceptButton}
          cancelButton={args.cancelButton}
          warningText={args.warningText}
          confirmWord={args.confirmWord}
          size="md"
          onAcceptClick={args.onAcceptClick}
          onCancelClick={args.onCancelClick}
        />
      </div>
    </div>
  </Provider>
);

const BasicConfirmation = Template.bind({});
const TextConfirmation = Template.bind({});
const WarningConfirmation = Template.bind({});

BasicConfirmation.args = {
  header: 'Delete Confirmation',
  body: 'Are you sure you want to delete this product?',
  onAcceptClick: action('accepted'),
  onCancelClick: action('canceled'),
};
TextConfirmation.args = {
  header: 'Delete Confirmation',
  body: 'Are you sure you want to delete this product?',
  acceptButton: 'Yes',
  cancelButton: 'No, cancel',
  confirmWord: 'CONFIRMATION_TEXT',
  onAcceptClick: action('accepted'),
  onCancelClick: action('canceled'),
};
WarningConfirmation.args = {
  header: <Translate>Are you sure</Translate>,
  body: "You can't undo this action",
  acceptButton: 'Yes',
  cancelButton: 'No',
  warningText: 'Other users will be affected by this action',
  confirmWord: 'CONFIRM',
  onAcceptClick: action('accepted'),
  onCancelClick: action('canceled'),
};
export { BasicConfirmation, TextConfirmation, WarningConfirmation };

export default ConfirmationModalStory as ComponentMeta<typeof ConfirmationModal>;
