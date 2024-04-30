/* eslint-disable react/jsx-props-no-spreading */
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
          <InputField {...args} />
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

const WithErrorMessage = {
  ...InputFieldStory,
  args: {
    ...Basic.args,
    errorMessage: "This is an error message that will show when there's an error",
    value: 'This value has errors',
    clearFieldAction: () => {},
  },
};

const WithPreText = {
  ...InputFieldStory,
  args: {
    ...Basic.args,
    value: 'example.com',
    preText: 'https://',
    clearFieldAction: () => {},
  },
};

export { Basic, WithClearFieldButton, WithError, WithErrorMessage, WithPreText };

export default meta;
