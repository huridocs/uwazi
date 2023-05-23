import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { InputField } from 'V2/Components/Forms';

const meta: Meta<typeof InputField> = {
  title: 'Forms/InputField',
  component: InputField,
};

type Story = StoryObj<typeof InputField>;

const InputFieldStory: Story = {
  render: args => (
    <Provider store={createStore()}>
      <div className="tw-content">
        <div className="md:w-1/2">
          <InputField
            id={args.id}
            label={<p className="mb-2 text-lg">{args.label}</p>}
            disabled={args.disabled}
            hideLabel={args.hideLabel}
            hasErrors={args.hasErrors}
            clearFieldAction={args.clearFieldAction}
            placeholder={args.placeholder}
            value={args.value}
          />
        </div>
      </div>
    </Provider>
  ),
};

const Basic = {
  ...InputFieldStory,
  args: {
    id: '1',
    label: 'Input field label',
    disabled: false,
    hideLabel: false,
    hasErrors: false,
    placeholder: 'Users can get a hint of what value is expected in this field',
  },
};

const WithClearFieldButton = {
  ...InputFieldStory,
  args: {
    ...Basic.args,
    clearFieldAction: () => {},
    value:
      'This is a very long value that will not show over the clear field button even if it is very long',
  },
};

const WithError = {
  ...InputFieldStory,
  args: {
    ...Basic.args,
    hasErrors: true,
    value: 'This value has errors',
    clearFieldAction: () => {},
  },
};

export { Basic, WithClearFieldButton, WithError };

export default meta;
