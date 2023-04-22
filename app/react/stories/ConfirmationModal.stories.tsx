import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Provider } from 'react-redux';
import { Modal } from 'V2/Components/UI/Modal';
import { ConfirmationModal } from 'app/V2/Components/UI/ConfirmationModal';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';

const ConfirmationModalStory = {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    actions: {
      handles: ['keyup'],
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

const Confirmation = Template.bind({});

Confirmation.args = {
  header: 'Delete Confirmation',
  body: 'Are you sure you want to delete this product?',
  acceptButton: 'Yes',
  cancelButton: 'No, cancel',
  warningText: 'Other users will be affected by this action',
  confirmWord: 'CONFIRM',
  onAcceptClick: action('accepted'),
  onCancelClick: action('canceled'),
};

export { Confirmation };

export default ConfirmationModalStory as ComponentMeta<typeof ConfirmationModal>;
