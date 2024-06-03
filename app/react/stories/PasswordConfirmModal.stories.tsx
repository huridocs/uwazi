import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Provider } from 'react-redux';
import { PasswordConfirmModal } from 'app/V2/Components/UI';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';

const meta: Meta<typeof PasswordConfirmModal> = {
  title: 'Components/Modal/ConfirmationModal',
  component: PasswordConfirmModal,
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

type Story = StoryObj<typeof PasswordConfirmModal>;

const Primary: Story = {
  render: args => (
    <Provider store={createStore()}>
      <div className="tw-content">
        <div className="container w-10 h-10">
          <PasswordConfirmModal
            size="md"
            onAcceptClick={args.onAcceptClick}
            onCancelClick={args.onCancelClick}
          />
        </div>
      </div>
    </Provider>
  ),
};

const PasswordConfirm: Story = {
  ...Primary,
  args: {
    onAcceptClick: action('accepted'),
    onCancelClick: action('canceled'),
  },
};

export { PasswordConfirm };

export default meta;
