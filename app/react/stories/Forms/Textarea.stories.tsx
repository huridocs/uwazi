/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Textarea } from 'V2/Components/Forms';

const meta: Meta<typeof Textarea> = {
  title: 'Forms/Textarea',
  component: Textarea,
};

type Story = StoryObj<typeof Textarea>;

const InputFieldStory: Story = {
  render: args => (
    <div className="tw-content">
      <div className="md:w-1/2">
        <Textarea {...args} />
      </div>
    </div>
  ),
};

const Basic = {
  ...InputFieldStory,
  args: {
    id: '1',
    label: 'Textarea field label',
    disabled: false,
    hideLabel: false,
    hasErrors: false,
    placeholder: 'Users can get a hint of what value is expected in this field',
    resize: 'none',
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

export { Basic, WithClearFieldButton, WithError, WithErrorMessage };

export default meta;
