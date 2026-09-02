/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { InputField } from '#V2/Components/Forms/index.js';

const meta = preview.meta({
  title: 'Forms/InputField',
  component: InputField,
});

const InputFieldStory = meta.story({
  args: {
    id: '1',
    label: 'Input field label',
    disabled: false,
    hideLabel: false,
    hasErrors: false,
    placeholder: 'Users can get a hint of what value is expected in this field',
  },
  render: args => (
    <div className="tw-content">
      <div className="md:w-1/2">
        <InputField {...args} />
      </div>
    </div>
  ),
});

const InteractiveWrapper = ({
  initialValue = '',
  clearFieldAction,
  icon,
  id,
  onChange,
  ...props
}: {
  initialValue?: string;
  clearFieldAction?: () => void;
  icon?: React.ReactNode;
  id: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  [key: string]: any;
}) => {
  const [value, setValue] = useState(initialValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onChange?.(e);
  };

  const handleClear = () => {
    setValue('');
    clearFieldAction?.();
  };

  return (
    <InputField
      {...props}
      id={id}
      value={value}
      onChange={handleChange}
      clearFieldAction={clearFieldAction ? handleClear : undefined}
      icon={icon}
    />
  );
};

const Basic = storyExtend(InputFieldStory, {
  args: {
    id: '1',
    label: 'Input field label',
    disabled: false,
    hideLabel: false,
    hasErrors: false,
    placeholder: 'Users can get a hint of what value is expected in this field',
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

const WithPreText = storyExtend(InputFieldStory, {
  args: {
    ...Basic.composed.args,
    value: 'example.com',
    preText: 'https://',
    clearFieldAction: () => {},
  },
});

const WithIcon = meta.story({
  render: args => (
    <div className="tw-content">
      <div className="md:w-1/2">
        <InteractiveWrapper
          {...args}
          placeholder="Search..."
          icon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />}
        />
      </div>
    </div>
  ),
  args: {
    ...Basic.composed.args,
  },
});

const WithIconAndClearButton = meta.story({
  render: args => (
    <div className="tw-content">
      <div className="md:w-1/2">
        <InteractiveWrapper
          {...args}
          placeholder="Search..."
          icon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />}
          clearFieldAction={() => {}}
        />
      </div>
    </div>
  ),
  args: {
    ...Basic.composed.args,
  },
});

const WithIconAndClearButtonWithValue = meta.story({
  render: args => (
    <div className="tw-content">
      <div className="md:w-1/2">
        <InteractiveWrapper
          {...args}
          initialValue="Search query"
          placeholder="Search..."
          icon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />}
          clearFieldAction={() => {}}
        />
      </div>
    </div>
  ),
  args: {
    ...Basic.composed.args,
  },
});

export {
  Basic,
  WithClearFieldButton,
  WithError,
  WithErrorMessage,
  WithPreText,
  WithIcon,
  WithIconAndClearButton,
  WithIconAndClearButtonWithValue,
};
