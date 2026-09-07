/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { Textarea } from '#V2/Components/Forms/index.js';

const meta = preview.meta({
  title: 'Forms/Textarea',
  component: Textarea,
});

const InputFieldStory = meta.story({
  args: {
    id: '1',
    label: 'Textarea field label',
    disabled: false,
    hideLabel: false,
    hasErrors: false,
    placeholder: 'Users can get a hint of what value is expected in this field',
    resize: 'none',
  },
  render: args => (
    <div className="tw-content">
      <div className="md:w-1/2">
        <Textarea {...args} />
      </div>
    </div>
  ),
});

const Basic = storyExtend(InputFieldStory, {
  args: {
    id: '1',
    label: 'Textarea field label',
    disabled: false,
    hideLabel: false,
    hasErrors: false,
    placeholder: 'Users can get a hint of what value is expected in this field',
    resize: 'none',
  },
});

const WithClearFieldButton = storyExtend(InputFieldStory, {
  args: {
    ...Basic.composed.args,
    clearFieldAction: () => {},
    value:
      'This is a very long value that will not show over the clear field button even if it is very long',
  },
});

const WithError = storyExtend(InputFieldStory, {
  args: {
    ...Basic.composed.args,
    hasErrors: true,
    value: 'This value has errors',
    clearFieldAction: () => {},
  },
});

const WithErrorMessage = storyExtend(InputFieldStory, {
  args: {
    ...Basic.composed.args,
    errorMessage: "This is an error message that will show when there's an error",
    value: 'This value has errors',
    clearFieldAction: () => {},
  },
});

export { Basic, WithClearFieldButton, WithError, WithErrorMessage };
