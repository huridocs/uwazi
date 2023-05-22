import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Provider } from 'react-redux';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { InputField } from 'V2/Components/Forms';

const InputFieldStory = {
  title: 'Forms/InputField',
  component: InputField,
};

const Template: ComponentStory<typeof InputField> = args => (
  <Provider store={createStore()}>
    <div className="tw-content">
      <div className="md:w-1/2">
        <InputField
          id={args.id}
          label={<p className="text-lg mb-2">{args.label}</p>}
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
);

const Basic = Template.bind({});
const WithClearFieldButton = Template.bind({});
const WithError = Template.bind({});

Basic.args = {
  id: '1',
  label: 'Input field label',
  disabled: false,
  hideLabel: false,
  hasErrors: false,
  placeholder: 'Users can get a hint of what value is expected in this field',
};

WithClearFieldButton.args = {
  ...Basic.args,
  clearFieldAction: () => {},
  value:
    'This is a very long value that will not show over the clear field button even if it is very long',
};

WithError.args = {
  ...Basic.args,
  hasErrors: true,
  value: 'This value has errors',
  clearFieldAction: () => {},
};

export { Basic, WithClearFieldButton, WithError };

export default InputFieldStory as ComponentMeta<typeof InputField>;
